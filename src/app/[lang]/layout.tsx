import type { Metadata, Viewport } from 'next'
import { Baloo_2, Be_Vietnam_Pro } from 'next/font/google'
import { notFound } from 'next/navigation'
import { PaletteHead } from '@/components/PaletteHead'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { SmoothScroll } from '@/components/SmoothScroll'
import { StoreHydrator } from '@/components/StoreHydrator'
import { LOCALES, OG_LOCALE, hasLocale } from '@/i18n/config'
import { dictionaries } from '@/i18n/dictionaries'
import { LangProvider } from '@/i18n/LangProvider'
import { langFrom, ogImage } from '@/i18n/metadata'
import { DEFAULT_PALETTE, PALETTES } from '@/lib/palettes'
import { SHOP, SITE_URL } from '@/lib/shop'
import '../globals.css'

// `subsets` only decides what is preloaded; every subset stays available through `unicode-range`. Latin plus
// the Vietnamese subset covers every letter of both languages (đ, ơ, ư included), so latin-ext is not preloaded.
const baloo = Baloo_2({
  weight: ['500', '600', '700', '800'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-baloo',
  display: 'swap',
})

const beVietnam = Be_Vietnam_Pro({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-be-vietnam',
  display: 'swap',
})

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const lang = await langFrom(params)
  const { meta } = dictionaries[lang].common
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: meta.siteTitle, template: meta.titleTemplate },
    description: meta.description,
    applicationName: SHOP.name,
    authors: [{ name: SHOP.maker.name, url: SHOP.maker.url }],
    openGraph: {
      type: 'website',
      siteName: SHOP.name,
      title: meta.siteTitle,
      description: meta.ogDescription,
      locale: OG_LOCALE[lang],
      images: [ogImage(lang)],
    },
    twitter: { card: 'summary_large_image' },
  }
}

export const viewport: Viewport = {
  // The default set's cream; the palette switch updates the tag when a visitor picks another set.
  themeColor: PALETTES[DEFAULT_PALETTE].cream,
  colorScheme: 'light',
}

export default async function RootLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const { common } = dictionaries[lang]
  return (
    // `data-palette` may change before hydration (the saved set), hence suppressHydrationWarning.
    <html
      lang={lang}
      data-palette={DEFAULT_PALETTE}
      className={`${baloo.variable} ${beVietnam.variable}`}
      suppressHydrationWarning
    >
      <head>
        <PaletteHead />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-ink px-4 py-2 font-semibold text-cream focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {common.skip}
        </a>
        <LangProvider lang={lang}>
          <StoreHydrator />
          <SmoothScroll />
          <SiteHeader />
          {/* Focusable by script: where the focus goes when what held it is gone (the welcome screen, the last cart line). */}
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <SiteFooter lang={lang} />
        </LangProvider>
      </body>
    </html>
  )
}
