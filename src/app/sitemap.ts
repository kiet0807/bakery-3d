import type { MetadataRoute } from 'next'
import { DEFAULT_LOCALE, LOCALES, localeHref } from '@/i18n/config'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bakery-3d.vercel.app'

/** Every page, once per language, each pointing at its other-language twin. */
const PAGES: { path: string; priority: number }[] = [
  { path: '/', priority: 1 },
  { path: '/design', priority: 0.9 },
  { path: '/menu', priority: 0.9 },
  { path: '/about', priority: 0.6 },
  { path: '/faq', priority: 0.5 },
  { path: '/policies', priority: 0.4 },
  { path: '/cart', priority: 0.2 },
]

const absolute = (path: string) => new URL(path, siteUrl).toString()

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap(({ path, priority }) =>
    LOCALES.map((lang) => ({
      url: absolute(localeHref(lang, path)),
      changeFrequency: 'monthly' as const,
      priority: lang === DEFAULT_LOCALE ? priority : Math.round(priority * 8) / 10,
      alternates: {
        languages: Object.fromEntries(LOCALES.map((other) => [other, absolute(localeHref(other, path))])),
      },
    })),
  )
}
