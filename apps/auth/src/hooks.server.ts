import type { Handle } from '@sveltejs/kit';
import { env } from '$lib/server/environment';
import { backendFetch } from 'shared/server';
export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = null;
  try {
    const response = await backendFetch(event, env, '/sso/session', {
      headers: { cookie: event.request.headers.get('cookie') ?? '' }
    });
    if (response.ok) event.locals.user = (await response.json()).user;
  } catch {
    /* public auth stays available during outages */
  }
  return resolve(event);
};
