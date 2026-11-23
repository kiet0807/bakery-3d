import type { Metadata } from 'next'
import { Baloo_2, Be_Vietnam_Pro } from 'next/font/google'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { PaletteHead } from '@/components/PaletteHead'
import { dictionaries } from '@/i18n/dictionaries'
import { DEFAULT_PALETTE } from '@/lib/palettes'
import './globals.css'

const baloo = Baloo_2({
  weight: ['700', '800'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-baloo',
  display: 'swap',
})

const beVietnam = Be_Vietnam_Pro({
  weight: ['400', '600'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-be-vietnam',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "404 · Kai's Bakery",
  robots: { index: false },
}

/**
 * Any address that matches no page. It renders outside the [lang] layout, so the request's language is
 * unknown: the page says it in Vietnamese first, then in English, and links to both home pages.
 */
export default function GlobalNotFound() {
  const vi = dictionaries.vi.common.notFound
  const en = dictionaries.en.common.notFound
  return (
    <html
      lang="vi"
      data-palette={DEFAULT_PALETTE}
      className={`${baloo.variable} ${beVietnam.variable}`}
      suppressHydrationWarning
    >
      <head>
        <PaletteHead />
      </head>
      <body>
        <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-6 px-4 py-16 text-center">
          <Logo className="h-20 w-20 animate-wiggle" />
          <p className="font-display text-7xl font-extrabold text-brand">404</p>
          <h1 className="font-display text-4xl leading-tight font-extrabold">{vi.title}</h1>
          <p className="max-w-md text-lg leading-relaxed text-muted">{vi.body}</p>
          <p className="flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn btn-buy">
              {vi.home}
            </Link>
            <Link href="/menu" className="btn btn-ghost">
              {vi.menu}
            </Link>
          </p>
          <div lang="en" className="mt-6 space-y-2 border-t border-line pt-6">
            <h2 className="font-display text-2xl font-bold">{en.title}</h2>
            <p className="text-muted">
              {en.body}{' '}
              <Link href="/en" className="font-semibold text-leaf underline underline-offset-4">
                {en.home}
              </Link>{' '}
              <span aria-hidden>·</span>{' '}
              <Link href="/en/menu" className="font-semibold text-leaf underline underline-offset-4">
                {en.menu}
              </Link>
            </p>
          </div>
        </main>
      </body>
    </html>
  )
}
