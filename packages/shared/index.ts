export type RuntimeEnvironment = Record<string, string | undefined>;

function origin(value: string, name: string, production: boolean): string {
  const url = new URL(value);
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`${name} must be an origin without credentials, path, query or fragment`);
  }
  if (url.protocol !== 'https:' && (production || url.protocol !== 'http:')) {
    throw new Error(`${name} requires ${production ? 'HTTPS' : 'HTTP or HTTPS'}`);
  }
  return url.origin;
}

export function getUrls(
  env: RuntimeEnvironment = typeof process === 'undefined' ? {} : process.env
) {
  const production = env.NODE_ENV === 'production';
  const frontend = {
    landing: origin(
      env.PUBLIC_WEB_ORIGIN ?? (production ? 'https://ksi.edu.pl' : 'http://localhost:5173'),
      'PUBLIC_WEB_ORIGIN',
      production
    ),
    auth: origin(
      env.PUBLIC_AUTH_ORIGIN ?? (production ? 'https://auth.ksi.edu.pl' : 'http://localhost:5174'),
      'PUBLIC_AUTH_ORIGIN',
      production
    ),
    dashboard: origin(
      env.PUBLIC_DASHBOARD_ORIGIN ??
        (production ? 'https://dash.ksi.edu.pl' : 'http://localhost:5175'),
      'PUBLIC_DASHBOARD_ORIGIN',
      production
    )
  };
  const backend = origin(
    env.PUBLIC_API_ORIGIN ?? (production ? 'https://api.ksi.edu.pl' : 'http://localhost:3000'),
    'PUBLIC_API_ORIGIN',
    production
  );
  const environment = env.KSI_ENVIRONMENT ?? (production ? 'production' : 'development');
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(environment)) throw new Error('Invalid KSI_ENVIRONMENT');
  const websocket = new URL(
    env.PUBLIC_WS_ORIGIN ?? (production ? 'wss://ws.ksi.edu.pl' : 'ws://localhost:3000')
  );
  if (websocket.protocol !== (production ? 'wss:' : 'ws:') && websocket.protocol !== 'wss:')
    throw new Error('Invalid websocket protocol');
  return {
    backend,
    internalBackend: env.INTERNAL_API_ORIGIN
      ? origin(env.INTERNAL_API_ORIGIN, 'INTERNAL_API_ORIGIN', false)
      : backend,
    environment,
    websocket: websocket.origin,
    frontend: { ...frontend, all: Object.values(frontend) }
  };
}
