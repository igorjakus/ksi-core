export type PublicPrivacy = 'full-name' | 'last-initial' | 'initials';
export function displayName(
  profile: { firstName: string; lastName: string; publicPrivacy: PublicPrivacy },
  protectedView = false
): string {
  const first = profile.firstName.trim(),
    last = profile.lastName.trim();
  if (protectedView || profile.publicPrivacy === 'full-name')
    return [first, last].filter(Boolean).join(' ');
  const initial = (name: string) => (Array.from(name)[0] ? `${Array.from(name)[0]}.` : '');
  return [profile.publicPrivacy === 'initials' ? initial(first) : first, initial(last)]
    .filter(Boolean)
    .join(' ');
}
export function anonymousAlias(randomId: string): string {
  if (!/^[a-zA-Z0-9_-]{8,}$/.test(randomId))
    throw new Error('Anonymization requires a unique random identifier');
  return `Member ${randomId}`;
}
