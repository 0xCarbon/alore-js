export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'pt'],
} as const;

export type Locale = (typeof i18n)['locales'][number];

export const dictionaries = {
  en: () => import('../dictionaries/en.json').then((module) => module.default),
  pt: () => import('../dictionaries/pt.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) =>
  dictionaries[locale as keyof typeof dictionaries]();

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
