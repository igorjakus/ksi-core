import { expect, test } from 'bun:test';
import { validAvatar, canReviewAvatar } from './avatar-review';
test('avatar moderation is active-administrator only and respects denials', () => {
  const admin = {
    id: 'a',
    role: 'administrator' as const,
    membershipStatus: 'active' as const,
    flags: []
  };
  expect(canReviewAvatar(admin)).toBe(true);
  expect(canReviewAvatar({ ...admin, role: 'board' })).toBe(false);
  expect(canReviewAvatar({ ...admin, membershipStatus: 'pending' })).toBe(false);
  expect(canReviewAvatar({ ...admin, flags: ['-users.approvals.*'] })).toBe(false);
});
test('avatar submissions allow verified image types with a 5 MiB limit', () => {
  expect(validAvatar('image/png', 100)).toBe(true);
  expect(validAvatar('image/svg+xml', 100)).toBe(false);
  expect(validAvatar('application/pdf', 100)).toBe(false);
  expect(validAvatar('image/jpeg', 5 * 1024 * 1024 + 1)).toBe(false);
});
