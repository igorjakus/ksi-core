import { expect, test } from 'bun:test';
import { getUrls } from './index';
test('local API address matches actual server routes', () => {
  expect(getUrls({}).backend).toBe('http://localhost:3000');
  expect(getUrls({}).frontend.all).toHaveLength(3);
});
test('branch config is runtime-driven', () => {
  const env = {
    NODE_ENV: 'production',
    KSI_ENVIRONMENT: 'feature-abc123',
    PUBLIC_API_ORIGIN: 'https://feature-abc123-api.ksi.edu.pl',
    INTERNAL_API_ORIGIN: 'http://backend:3000'
  };
  expect(getUrls(env).backend).toBe(env.PUBLIC_API_ORIGIN);
  expect(getUrls(env).internalBackend).toBe(env.INTERNAL_API_ORIGIN);
});
test('reject unsafe configured origins', () => {
  expect(() =>
    getUrls({ NODE_ENV: 'production', PUBLIC_AUTH_ORIGIN: 'http://auth.ksi.edu.pl' })
  ).toThrow();
  expect(() => getUrls({ PUBLIC_API_ORIGIN: 'http://user:pass@localhost:3000' })).toThrow();
});
