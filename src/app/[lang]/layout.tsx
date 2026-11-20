import type { Metadata, Viewport } from 'next'
import { Baloo_2, Be_Vietnam_Pro } from 'next/font/google'
import { notFound } from 'next/navigation'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { StoreHydrator } from '@/components/StoreHydrator'
import { LOCALES, OG_LOCALE, hasLocale } from '@/i18n/config'
import { dictionaries } from '@/i18n/dictionaries'
import { LangProvider } from '@/i18n/LangProvider'
import { langFrom } from '@/i18n/metadata'
import { SHOP } from '@/lib/shop'
import '../globals.css'

const baloo = Baloo_2({
  weight: ['500', '600', '700', '800'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-baloo',
  display: 'swap',
})

const beVietnam = Be_Vietnam_Pro({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-be-vietnam',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bakery-3d.vercel.app'

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const lang = await langFrom(params)
  const { meta } = dictionaries[lang].common
  return {
    metadataBase: new URL(siteUrl),
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
    },
    twitter: { card: 'summary_large_image' },
  }
}

export const viewport: Viewport = {
  themeColor: '#fff8e5',
  colorScheme: 'light',
}

export default async function RootLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const { common } = dictionaries[lang]
  return (
    <html lang={lang} className={`${baloo.variable} ${beVietnam.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-ink px-4 py-2 font-semibold text-cream focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {common.skip}
        </a>
        <LangProvider lang={lang}>
          <StoreHydrator />
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter lang={lang} />
        </LangProvider>
      </body>
    </html>
  )
}
