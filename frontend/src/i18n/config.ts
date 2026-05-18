export type Locale = 'ru' | 'en';

export const defaultLocale: Locale = 'ru';

export const locales: Locale[] = ['ru', 'en'];

export const localeNames: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
};
