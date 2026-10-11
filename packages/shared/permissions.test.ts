import { expect, test } from 'bun:test';
import { permissions, permissionKeys, polishPermissionDescriptions } from './permissions';
import { effectivePermissions, validateFlags } from '../../apps/server/src/domain/permissions';
test('permission descriptions and authorization share the same complete registry', () => {
  const administrator = {
    id: 'test',
    role: 'administrator' as const,
    membershipStatus: 'active' as const,
    flags: []
  };
  expect([...effectivePermissions(administrator)].sort()).toEqual([...permissionKeys].sort());
  for (const permission of permissionKeys) {
    expect(permissions[permission].length).toBeGreaterThan(10);
    expect(polishPermissionDescriptions[permission].length).toBeGreaterThan(10);
    validateFlags([`+${permission}`, `-${permission}`]);
    expect(
      effectivePermissions({ ...administrator, flags: [`-${permission}`] }).has(permission)
    ).toBe(false);
  }
});
