export type ThemePreference = 'system' | 'light' | 'dark';
export const preferences = $state({
  theme: 'system' as ThemePreference,
  language: 'pl' as 'pl' | 'en'
});

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function persist(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Preferences still work without storage. */
  }
}
function applyTheme() {
  const dark =
    preferences.theme === 'dark' ||
    (preferences.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}
export function setTheme(theme: ThemePreference) {
  preferences.theme = theme;
  persist('ksi-dashboard-theme', theme);
  applyTheme();
}
export function setLanguage(language: 'pl' | 'en') {
  preferences.language = language;
  persist('ksi-dashboard-language', language);
  document.documentElement.lang = language;
}
export function initializePreferences() {
  function sync() {
    const theme = read('ksi-dashboard-theme');
    preferences.theme = theme === 'light' || theme === 'dark' ? theme : 'system';
    preferences.language = read('ksi-dashboard-language') === 'en' ? 'en' : 'pl';
    document.documentElement.lang = preferences.language;
    applyTheme();
  }
  sync();
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', applyTheme);
  window.addEventListener('storage', sync);
  return () => {
    media.removeEventListener('change', applyTheme);
    window.removeEventListener('storage', sync);
  };
}
