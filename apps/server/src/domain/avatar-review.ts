import { effectivePermissions, type Principal } from './permissions';
export const avatarMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
export function validAvatar(mime: string, size: number) {
  return avatarMimeTypes.includes(mime) && size > 0 && size <= 5 * 1024 * 1024;
}
export function canReviewAvatar(actor: Principal) {
  return (
    actor.role === 'administrator' &&
    effectivePermissions(actor).has('users.approvals.review-avatar')
  );
}
