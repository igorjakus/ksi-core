export const fields = ['research', 'community', 'engineering'] as const;
export const sectionTypes = ['leaders', 'members', 'main-article', 'articles', 'links'] as const;
export type Section = (typeof sectionTypes)[number];
export function validateLayout(layout: { type: Section; hidden: boolean }[]) {
  if (
    new Set(layout.map((s) => s.type)).size !== layout.length ||
    layout.some((s) => !sectionTypes.includes(s.type))
  )
    throw new Error('Invalid project layout');
}
export function visibleSections(
  layout: { type: Section; hidden: boolean }[],
  counts: Record<Section, number>
): Section[] {
  return layout.filter((s) => !s.hidden && counts[s.type] > 0).map((s) => s.type);
}
export function visibleMemberIds(
  memberIds: string[],
  leaderIds: string[],
  showLeaders: boolean
): string[] {
  return [...new Set(memberIds)].filter((id) => !showLeaders || !leaderIds.includes(id));
}
export function joinOutcome(locked: boolean, alreadyMember: boolean): 'member' | 'request' {
  return alreadyMember || !locked ? 'member' : 'request';
}
export function assertRevision(base: number, current: number): void {
  if (base !== current) throw new Error('REVISION_CONFLICT');
}
export function isPublicArticle(state: string): boolean {
  return state === 'published';
}
export function canDeleteFile(referenceCount: number, orphanedAt: Date | null, now: Date): boolean {
  return (
    referenceCount === 0 &&
    orphanedAt !== null &&
    now.getTime() - orphanedAt.getTime() >= 24 * 60 * 60 * 1000
  );
}
