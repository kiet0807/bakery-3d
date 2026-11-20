import type { Metadata } from 'next'
import { SHOP } from '@/lib/shop'
import { DEFAULT_LOCALE, LOCALES, OG_LOCALE, hasLocale, localeHref, type Locale } from './config'
import { dictionaries } from './dictionaries'

/**
 * The picture shown when a page is shared: the home scene at 1200×630, taken with `scripts/screenshot.mjs`.
 * Set here rather than as an `opengraph-image` file: each page sets its own `openGraph`, which would replace a
 * file image inherited from the layout.
 */
export function ogImage(lang: Locale) {
  return {
    url: '/og/kais-bakery.jpg',
    width: 1200,
    height: 630,
    alt: dictionaries[lang].common.meta.ogImageAlt,
  }
}

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
      images: [ogImage(lang)],
    },
  }
}
