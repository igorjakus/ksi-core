import { expect, test } from 'bun:test';
import { defaultBoardStatuses, validBoardStatuses, statusExists } from './board-statuses';
test('board statuses support custom columns and preserve default identities', () => {
  expect(validBoardStatuses([...defaultBoardStatuses, { id: 'review', name: 'Review' }])).toBe(
    true
  );
  expect(statusExists(defaultBoardStatuses, 'progress')).toBe(true);
  expect(statusExists(defaultBoardStatuses, 'foreign-column')).toBe(false);
});
test('board statuses reject duplicate IDs, unsafe keys and empty names', () => {
  for (const statuses of [
    [],
    [
      { id: 'a', name: 'A' },
      { id: 'a', name: 'B' }
    ],
    [{ id: '../x', name: 'X' }],
    [{ id: 'a', name: ' ' }],
    Array.from({ length: 21 }, (_, i) => ({ id: `s-${i}`, name: 'X' }))
  ])
    expect(validBoardStatuses(statuses)).toBe(false);
});

test('status colors accept only six-digit hex values', () => {
  expect(validBoardStatuses([{ id: 'custom', name: 'Review', color: '#aA12ef' }])).toBe(true);
  expect(validBoardStatuses([{ id: 'custom', name: 'Review', color: 'red' }])).toBe(false);
});
