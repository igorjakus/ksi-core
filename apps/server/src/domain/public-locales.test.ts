import { expect, test } from 'bun:test';
import { publicProfile } from '../routes/platform/content';
test('translated names retain public privacy and never expose protected name fields', () => {
  const member = {
    id: 'test',
    name: 'John Smith',
    firstName: 'John',
    lastName: 'Smith',
    nickname: null,
    bio: 'English bio',
    publicPrivacy: 'last-initial',
    membershipStatus: 'active',
    translations: { pl: { firstName: 'Jan', lastName: 'Kowalski', bio: 'Polski opis' } }
  } as any;
  expect(publicProfile(member, 'pl')).toMatchObject({ name: 'Jan K.', bio: 'Polski opis' });
  expect(publicProfile(member, 'pl')).not.toHaveProperty('translations');
  member.publicPrivacy = 'initials';
  expect(publicProfile(member, 'pl').name).toBe('J. K.');
  member.membershipStatus = 'deleted';
  member.name = 'Member random123';
  member.bio = null;
  expect(publicProfile(member, 'pl').name).toBe('Member random123');
});
