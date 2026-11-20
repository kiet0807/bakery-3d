import type { Metadata } from 'next'
import { SHOP } from '@/lib/shop'
import { DEFAULT_LOCALE, LOCALES, OG_LOCALE, hasLocale, localeHref, type Locale } from './config'

/** Reads the `[lang]` param the way every page receives it. */
export async function langFrom(params: Promise<{ lang: string }>): Promise<Locale> {
  const { lang } = await params
  return hasLocale(lang) ? lang : DEFAULT_LOCALE
}

/**
 * Title, description, canonical address and language alternates for one page.
 * `path` is the page without a language, e.g. "/menu".
 */
export function pageMetadata(
  lang: Locale,
  path: string,
  meta: { title: string; description: string },
  options: { absoluteTitle?: boolean } = {},
): Metadata {
  const url = localeHref(lang, path)
  return {
    title: options.absoluteTitle ? { absolute: meta.title } : meta.title,
    description: meta.description,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, localeHref(l, path)])),
        'x-default': localeHref(DEFAULT_LOCALE, path),
      },
    },
    openGraph: {
      type: 'website',
      siteName: SHOP.name,
      title: meta.title,
      description: meta.description,
      url,
      locale: OG_LOCALE[lang],
      alternateLocale: LOCALES.filter((l) => l !== lang).map((l) => OG_LOCALE[l]),
    },
  }
}
