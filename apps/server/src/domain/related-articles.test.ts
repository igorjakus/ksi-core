import { expect, test } from 'bun:test';
import { relatedArticles } from './related-articles';
const current = { id: 'current', projectId: 'robot', fields: ['engineering'] };
const candidate = (id: string, projectId: string | null, fields: string[], day = 1) => ({
  id,
  projectId,
  fields,
  createdAt: new Date(2026, 0, day),
  publishedAt: null
});
test('recommendations respect overlapping quotas, exclude self, deduplicate and promote recent articles', () => {
  const pool = [
    candidate('current', 'robot', ['engineering']),
    ...Array.from({ length: 5 }, (_, n) =>
      candidate(`project-${n}`, 'robot', ['engineering'], n + 1)
    ),
    ...Array.from({ length: 5 }, (_, n) =>
      candidate(`group-${n}`, 'other', ['engineering'], n + 1)
    ),
    candidate('discovery-old', null, [], 1),
    candidate('discovery-new', null, [], 10)
  ];
  const result = relatedArticles(current, pool, () => 0);
  expect(result.map((article) => article.id)).toEqual([
    'project-4',
    'project-3',
    'project-2',
    'group-4',
    'discovery-new'
  ]);
  expect(new Set(result.map((article) => article.id)).size).toBe(5);
});
test('sparse recommendations do not exceed quotas to fill space', () => {
  expect(
    relatedArticles(
      current,
      Array.from({ length: 8 }, (_, n) => candidate(String(n), 'robot', ['engineering']))
    )
  ).toHaveLength(3);
  expect(
    relatedArticles(
      current,
      Array.from({ length: 8 }, (_, n) => candidate(String(n), 'other', ['engineering']))
    )
  ).toHaveLength(4);
  expect(relatedArticles(current, [])).toEqual([]);
  expect(
    relatedArticles({ id: 'current', projectId: null, fields: [] }, [
      candidate('association', null, [])
    ])
  ).toHaveLength(1);
});
