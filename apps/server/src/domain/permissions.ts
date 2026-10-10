export const permissions = [
  'users.profile.edit-first-name',
  'users.profile.edit-last-name',
  'users.profile.edit-avatar',
  'users.approvals.review-avatar',
  'users.profile.edit-bio',
  'users.profile.edit-social-links',
  'users.profile.edit-privacy',
  'users.profile.edit-nickname',
  'users.membership.activate',
  'users.membership.suspend',
  'users.roles.assign',
  'users.permissions.assign',
  'users.accounts.anonymize',
  'users.members.manage-profile',
  'projects.catalog.create',
  'projects.catalog.edit',
  'projects.membership.join',
  'projects.membership.manage',
  'projects.layout.edit',
  'articles.content.propose',
  'articles.content.publish',
  'articles.authors.manage-credit',
  'collaboration.items.contribute',
  'collaboration.items.restore',
  'collaboration.threads.restrict',
  'audit.events.read',
  'files.objects.upload',
  'association.alerts.manage'
] as const;
export type Permission = (typeof permissions)[number];
export type Role = 'member' | 'board' | 'administrator';
export type MembershipStatus = 'pending' | 'active' | 'suspended' | 'deleted';
export interface Principal {
  id: string;
  role: Role;
  membershipStatus: MembershipStatus;
  flags: string[];
}
const memberDefaults: Permission[] = permissions.filter(
  (p) =>
    p.startsWith('users.profile.') ||
    [
      'projects.membership.join',
      'articles.content.propose',
      'articles.authors.manage-credit',
      'collaboration.items.contribute',
      'files.objects.upload'
    ].includes(p)
);
const boardDefaults: Permission[] = [
  ...memberDefaults,
  'users.membership.activate',
  'projects.catalog.create',
  'projects.catalog.edit',
  'projects.membership.manage',
  'projects.layout.edit',
  'articles.content.publish',
  'collaboration.items.restore',
  'collaboration.threads.restrict',
  'audit.events.read',
  'association.alerts.manage'
];
export function matches(pattern: string, permission: string): boolean {
  return pattern.endsWith('*')
    ? permission.startsWith(pattern.slice(0, -1))
    : pattern === permission;
}
export function validateFlags(flags: string[]): void {
  if (flags.length > 100) throw new Error('Too many permission flags');
  for (const flag of flags) {
    const pattern = flag.replace(/^[+-]/, '');
    if (!/^[a-z][a-z0-9.-]*\*?$/.test(pattern) || !permissions.some((p) => matches(pattern, p)))
      throw new Error(`Unknown permission flag: ${flag}`);
  }
}
export function effectivePermissions(user: Principal): Set<Permission> {
  if (user.membershipStatus !== 'active') return new Set();
  const defaults =
    user.role === 'administrator'
      ? permissions
      : user.role === 'board'
        ? boardDefaults
        : memberDefaults;
  const result = new Set<Permission>(defaults);
  for (const flag of user.flags.filter((f) => !f.startsWith('-'))) {
    for (const p of permissions) if (matches(flag.replace(/^\+/, ''), p)) result.add(p);
  }
  for (const flag of user.flags.filter((f) => f.startsWith('-'))) {
    for (const p of result) if (matches(flag.slice(1), p)) result.delete(p);
  }
  return result;
}
export interface ResourceScope {
  memberIds: string[];
  leaderIds: string[];
  association?: boolean;
}
export function canContribute(user: Principal, scope: ResourceScope): boolean {
  return (
    effectivePermissions(user).has('collaboration.items.contribute') &&
    (scope.association === true || user.role !== 'member' || scope.memberIds.includes(user.id))
  );
}
export function canLead(user: Principal, scope: ResourceScope): boolean {
  return (
    user.membershipStatus === 'active' &&
    (user.role !== 'member' || scope.leaderIds.includes(user.id))
  );
}
export function canReadThread(
  user: Principal,
  scope: ResourceScope,
  visibility: 'association' | 'members' | 'leaders',
  invitedIds: string[] = []
): boolean {
  if (user.membershipStatus !== 'active') return false;
  if (user.role !== 'member' || visibility === 'association') return true;
  if (visibility === 'members')
    return scope.association === true || scope.memberIds.includes(user.id);
  return scope.leaderIds.includes(user.id) || invitedIds.includes(user.id);
}
