/** The site's languages. Vietnamese is the default and has no prefix: `/menu` is Vietnamese, `/en/menu` English. */
export const LOCALES = ['vi', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'vi'

export const hasLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale)

/** `og:locale` values. */
export const OG_LOCALE: Record<Locale, string> = { vi: 'vi_VN', en: 'en_US' }

/**
 * The public address of a page in a language. `path` is written without a language, e.g. "/menu" or
 * "/design?preset=taro-dream#top"; external links and pure hashes are returned unchanged.
 */
export function localeHref(lang: Locale, path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path
  if (lang === DEFAULT_LOCALE) return path
  if (path === '/') return `/${lang}`
  if (path.startsWith('/?') || path.startsWith('/#')) return `/${lang}${path.slice(1)}`
  return `/${lang}${path}`
}

/** A pathname without its language prefix: "/en/menu" and "/vi/menu" both become "/menu". */
export function stripLocale(pathname: string): string {
  for (const lang of LOCALES) {
    if (pathname === `/${lang}`) return '/'
    if (pathname.startsWith(`/${lang}/`)) return pathname.slice(lang.length + 1)
  }
  return pathname || '/'
}
