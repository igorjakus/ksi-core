import { expect, test } from 'bun:test';
import { challenge, digest, randomToken, validateDestination, verifyChallenge } from './sso';
test('PKCE and opaque token hashing', () => {
  const token = randomToken();
  expect(verifyChallenge(token, challenge(token))).toBe(true);
  expect(verifyChallenge(randomToken(), challenge(token))).toBe(false);
  expect(digest(token)).not.toBe(token);
});
test('handoffs reject foreign domains and arbitrary paths', () => {
  const origins = ['https://dash.ksi.edu.pl'];
  validateDestination('https://dash.ksi.edu.pl/sso/callback', origins);
  for (const dest of [
    'https://dash.ksi.edu.pl.evil.test/sso/callback',
    'https://dash.ksi.edu.pl/redirect',
    'https://dash.ksi.edu.pl/sso/callback?next=evil'
  ])
    expect(() => validateDestination(dest, origins)).toThrow();
});
