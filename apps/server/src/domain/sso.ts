import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
export function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
export function randomToken(): string {
  return randomBytes(32).toString('base64url');
}
export function challenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}
export function verifyChallenge(verifier: string, expected: string): boolean {
  if (!/^[A-Za-z0-9_-]{43,128}$/.test(verifier)) return false;
  const actual = Buffer.from(challenge(verifier));
  const target = Buffer.from(expected);
  return actual.length === target.length && timingSafeEqual(actual, target);
}
export function validateDestination(destination: string, allowedOrigins: string[]): void {
  const url = new URL(destination);
  if (
    !allowedOrigins.includes(url.origin) ||
    url.pathname !== '/sso/callback' ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  )
    throw new Error('INVALID_DESTINATION');
}
