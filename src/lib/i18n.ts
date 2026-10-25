export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const hasLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value);

export type Localized<T = string> = Record<Locale, T>;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://clinexpro.net").replace(/\/$/, "");

/** hreflang alternates for a path without its locale prefix, e.g. "/services". */
export function alternates(locale: Locale, path: string) {
  const suffix = path === "/" ? "" : path;
  return {
    canonical: `${SITE_URL}/${locale}${suffix}`,
    languages: {
      en: `${SITE_URL}/en${suffix}`,
      fr: `${SITE_URL}/fr${suffix}`,
      "x-default": `${SITE_URL}/en${suffix}`,
    },
  };
}
