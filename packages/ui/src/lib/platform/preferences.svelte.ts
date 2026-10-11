import { observeTheme, setThemePreference, type ThemePreference } from './theme.js';
export type { ThemePreference } from './theme.js';
export const preferences = $state({
  theme: 'system' as ThemePreference,
  language: 'pl' as 'pl' | 'en'
});
export function setTheme(theme: ThemePreference) {
  preferences.theme = theme;
  setThemePreference(theme);
}
export function setLanguage(language: 'pl' | 'en') {
  preferences.language = language;
  try {
    localStorage.setItem('ksi-dashboard-language', language);
  } catch {}
  document.documentElement.lang = language;
}
export function initializePreferences() {
  const language = () => {
    try {
      preferences.language = localStorage.getItem('ksi-dashboard-language') === 'en' ? 'en' : 'pl';
    } catch {}
    document.documentElement.lang = preferences.language;
  };
  language();
  const cleanup = observeTheme((theme: ThemePreference) => (preferences.theme = theme));
  window.addEventListener('storage', language);
  return () => {
    cleanup();
    window.removeEventListener('storage', language);
  };
}
