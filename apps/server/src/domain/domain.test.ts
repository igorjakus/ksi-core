import { describe, expect, test } from 'bun:test';
import {
  canContribute,
  canReadThread,
  effectivePermissions,
  validateFlags,
  type Principal
} from './permissions';
import { anonymousAlias, displayName } from './profiles';
import {
  assertRevision,
  canDeleteFile,
  joinOutcome,
  visibleMemberIds,
  visibleSections
} from './projects';
const member: Principal = { id: 'a', role: 'member', membershipStatus: 'active', flags: [] };
describe('authorization boundaries', () => {
  test('denials beat defaults and explicit grants regardless of ordering', () => {
    const result = effectivePermissions({
      ...member,
      flags: ['-users.profile.edit*', '+users.profile.edit-first-name']
    });
    expect(result.has('users.profile.edit-first-name')).toBe(false);
    expect(result.has('projects.membership.join')).toBe(true);
  });
  test('pending and suspended accounts cannot grant themselves access', () => {
    for (const membershipStatus of ['pending', 'suspended', 'deleted'] as const)
      expect(
        effectivePermissions({ ...member, role: 'administrator', membershipStatus, flags: ['*'] })
          .size
      ).toBe(0);
  });
  test('unknown flags are rejected', () => {
    expect(() => validateFlags(['+users.password.steal'])).toThrow();
    validateFlags(['-users.profile.edit*']);
  });
  test('global grants do not bypass project contribution membership', () => {
    expect(canContribute(member, { memberIds: [], leaderIds: [] })).toBe(false);
  });
  test('invitation permits reading leader threads but not contribution elsewhere', () => {
    const scope = { memberIds: [], leaderIds: [] };
    expect(canReadThread(member, scope, 'leaders', ['a'])).toBe(true);
    expect(canReadThread(member, scope, 'members')).toBe(false);
  });
  test('board has oversight but no role assignment', () => {
    const board = { ...member, role: 'board' as const };
    expect(canReadThread(board, { memberIds: [], leaderIds: [] }, 'leaders')).toBe(true);
    expect(effectivePermissions(board).has('users.roles.assign')).toBe(false);
  });
});
test('public privacy never alters protected display', () => {
  const p = { firstName: 'Anna', lastName: 'Kowalska', publicPrivacy: 'initials' as const };
  expect(displayName(p)).toBe('A. K.');
  expect(displayName(p, true)).toBe('Anna Kowalska');
  expect(anonymousAlias('abcdefgh')).not.toBe(anonymousAlias('ijklmnop'));
});
test('project joins are idempotent and leaders are not repeated', () => {
  expect(joinOutcome(true, true)).toBe('member');
  expect(joinOutcome(true, false)).toBe('request');
  expect(visibleMemberIds(['a', 'b', 'b'], ['a'], true)).toEqual(['b']);
});
test('empty and hidden sections are omitted', () => {
  expect(
    visibleSections(
      [
        { type: 'members', hidden: false },
        { type: 'links', hidden: true }
      ],
      { leaders: 0, members: 0, 'main-article': 0, articles: 0, links: 2 }
    )
  ).toEqual([]);
});
test('stale proposals conflict', () => {
  expect(() => assertRevision(1, 2)).toThrow('REVISION_CONFLICT');
});
test('orphan grace protects uploads and referenced archives', () => {
  const now = new Date('2026-10-10T12:00:00Z');
  expect(canDeleteFile(1, new Date(0), now)).toBe(false);
  expect(canDeleteFile(0, new Date(now.getTime() - 1000), now)).toBe(false);
  expect(canDeleteFile(0, new Date(0), now)).toBe(true);
});
