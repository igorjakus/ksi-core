/** Given names stay editable; keep compound surnames together and never invent one. */
export function splitProfileName(name: string) {
  const [firstName = '', ...familyName] = name.trim().split(/\s+/u);
  return { firstName: firstName.slice(0, 100), lastName: familyName.join(' ').slice(0, 100) };
}
