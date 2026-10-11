type Candidate = {
  id: string;
  projectId: string | null;
  fields: string[] | null;
  publishedAt: Date | string | null;
  createdAt: Date | string;
};

/** Group quotas include the same project, leaving a slot for discovery when possible. */
export function relatedArticles<T extends Candidate>(
  current: Pick<Candidate, 'id' | 'projectId' | 'fields'>,
  candidates: T[],
  random: () => number = Math.random
): T[] {
  const sameProject = (article: T) =>
    !!current.projectId && article.projectId === current.projectId;
  const sameGroup = (article: T) =>
    (article.fields ?? []).some((field) => current.fields?.includes(field));
  const date = (article: T) => new Date(article.publishedAt ?? article.createdAt).getTime();
  const pool = candidates
    .filter((article) => article.id !== current.id)
    .sort((a, b) => date(b) - date(a) || a.id.localeCompare(b.id));
  const selected = pool.filter(sameProject).slice(0, 3);
  for (const article of pool) {
    if (selected.length >= 4) break;
    if (!sameProject(article) && sameGroup(article)) selected.push(article);
  }
  const discovery = pool.filter(
    (article) => !selected.includes(article) && !sameProject(article) && !sameGroup(article)
  );
  // Sample without replacement, weighting recent publications more strongly.
  while (selected.length < 5 && discovery.length) {
    const weights = discovery.map((_, index) => 1 / (index + 1));
    let draw =
      Math.min(0.999999, Math.max(0, random())) * weights.reduce((sum, weight) => sum + weight, 0);
    let index = 0;
    while (index < weights.length - 1 && draw >= weights[index]!) draw -= weights[index++]!;
    selected.push(discovery.splice(index, 1)[0]!);
  }
  return selected;
}
