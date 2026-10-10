export type BoardStatus = { id: string; name: string; color?: string };
export const defaultBoardStatuses: BoardStatus[] = [
  { id: 'todo', name: 'To do' },
  { id: 'progress', name: 'In progress' },
  { id: 'done', name: 'Done' }
];
export function validBoardStatuses(statuses: BoardStatus[]) {
  return (
    statuses.length >= 1 &&
    statuses.length <= 20 &&
    new Set(statuses.map((status) => status.id)).size === statuses.length &&
    statuses.every(
      (status) =>
        /^[a-z][a-z0-9-]{0,39}$/.test(status.id) &&
        status.name.trim().length > 0 &&
        status.name.length <= 60 &&
        (status.color === undefined || /^#[0-9a-fA-F]{6}$/.test(status.color))
    )
  );
}
export function statusExists(statuses: BoardStatus[], id: string) {
  return statuses.some((status) => status.id === id);
}
