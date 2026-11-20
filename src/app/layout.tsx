import type { Metadata, Viewport } from 'next'
import { Barlow, Barlow_Condensed } from 'next/font/google'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { StoreHydrator } from '@/components/StoreHydrator'
import './globals.css'

const barlow = Barlow({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-barlow',
  display: 'swap',
})

const barlowCondensed = Barlow_Condensed({
  weight: ['200', '300', '400', '500'],
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-barlow-condensed',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bakery-3d.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Crumb & Cloud · Cakes, built in 3D',
    template: '%s · Crumb & Cloud',
  },
  description:
    'A demo bakery for showing what the web can do in 2026: design a layer cake in real-time 3D, slice it to see inside, and watch it boxed up. Not a real shop.',
  applicationName: 'Crumb & Cloud',
  authors: [{ name: 'Kiệt Nguyễn', url: 'https://kietnguyen.io.vn' }],
  openGraph: {
    type: 'website',
    siteName: 'Crumb & Cloud',
    title: 'Crumb & Cloud · Cakes, built in 3D',
    description: 'Design a layer cake in real-time 3D, then slice it to see every layer. A 3D web showcase.',
  },
  twitter: { card: 'summary_large_image' },
}

export const viewport: Viewport = {
  themeColor: '#030b17',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-moon px-4 py-2 font-medium text-night focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <StoreHydrator />
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
