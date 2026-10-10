import { expect, test } from 'bun:test';
import { validProfileLink } from './profile-links';
test('profile links allow clearing and require an actual provider profile', () => {
  expect(validProfileLink('github', null)).toBe(true);
  expect(validProfileLink('github', 'https://github.com/ksiuwr')).toBe(true);
  expect(validProfileLink('linkedin', 'https://www.linkedin.com/in/anna-k')).toBe(true);
  for (const link of [
    'https://example.com/anna',
    'https://github.com.evil.test/anna',
    'javascript:alert(1)',
    'https://github.com/anna/repository',
    'http://github.com/anna'
  ])
    expect(validProfileLink('github', link)).toBe(false);
});
