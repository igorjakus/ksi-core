export function validProfileLink(
  provider: 'github' | 'linkedin',
  value: string | null | undefined
) {
  if (!value) return true;
  return (
    provider === 'github'
      ? /^https:\/\/github\.com\/[A-Za-z0-9_-]+\/?$/
      : /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?$/
  ).test(value);
}
