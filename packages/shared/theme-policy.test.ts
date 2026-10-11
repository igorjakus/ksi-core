import { expect, test } from 'bun:test';
import { validTheme, themeFromCookie, themeCookieDomain } from './theme-policy.ts';
test('theme preference accepts explicit modes and validates shared cookies', () => {
  for (const mode of ['system', 'light', 'dark']) expect(validTheme(mode)).toBe(true);
  expect(themeFromCookie('session=private; ksi-theme=dark; locale=pl')).toBe('dark');
  expect(themeFromCookie('ksi-theme=evil')).toBeNull();
  expect(themeFromCookie('other-ksi-theme=dark')).toBeNull();
});
test('theme preference domain is limited to KSI without changing session cookies', () => {
  expect(themeCookieDomain('auth.ksi.edu.pl')).toBe('ksi.edu.pl');
  expect(themeCookieDomain('ksi.edu.pl')).toBe('ksi.edu.pl');
  expect(themeCookieDomain('preview-dash.ksi.edu.pl')).toBe('ksi.edu.pl');
  for (const host of ['localhost', '127.0.0.1', 'ksi.edu.pl.evil.test', 'notksi.edu.pl'])
    expect(themeCookieDomain(host)).toBeNull();
});
