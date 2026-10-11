import { invalidate } from '$app/navigation';
import { loadLocale } from 'wuchale/load-utils';
import '../locales/main.loader.svelte.js';
import { locales } from '../locales/data.js';
import type { Locale } from '../locales/data.js';

function getInitialLocale(): Locale {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('locale');
    if (saved && (locales as string[]).includes(saved)) return saved as Locale;

    const cookieMatch = document.cookie.match(/(?:^|; )locale=([^;]*)/);
    if (cookieMatch && (locales as string[]).includes(cookieMatch[1])) {
      return cookieMatch[1] as Locale;
    }
  }
  return 'pl';
}

export const locale = $state({ current: getInitialLocale() });

export function setLocale(newLocale: Locale) {
  locale.current = newLocale;
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', newLocale);
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
  }
}

// The layout subscribes to this store, including locale restored from localStorage.
// Persist before invalidation so server loads use the same locale as the UI.
export async function refreshLocalizedContent(newLocale: Locale) {
  document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
  await Promise.all([loadLocale(newLocale), invalidate('ksi:localized-content')]);
}

export function getFlagEmoji(countryCode: string): string {
  if (countryCode.includes('-')) return getFlagEmoji(countryCode.split('-')[1]);
  return [...countryCode.toUpperCase()]
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

export interface LocaleOption {
  code: Locale;
  emoji: string;
  formattedLocale: string;
}

// Shared across the navbar, sidebar, and footer locale pickers so they never
// drift out of sync with one another. `$derived` can't be exported directly
// from a module, so consumers wrap these in their own `$derived(...)`.
export function getAvailableLocales(): LocaleOption[] {
  return locales
    .map((code) => ({
      code,
      emoji: getFlagEmoji(code),
      formattedLocale: new Intl.DisplayNames([code], { type: 'language' }).of(code)!
    }))
    .toSorted((a, b) => a.formattedLocale.localeCompare(b.formattedLocale));
}

export function getActiveLocale(): LocaleOption {
  const available = getAvailableLocales();
  return available.find((option) => option.code === locale.current) ?? available[0];
}
