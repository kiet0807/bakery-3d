import type { Metadata } from 'next'
import { Baloo_2, Be_Vietnam_Pro } from 'next/font/google'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { PaletteHead } from '@/components/PaletteHead'
import type { Locale } from '@/i18n/config'
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
 * Before the first paint, an address under `/en` turns the page English: the `lang` of the document and which of
 * the two versions below shows. Only the address is read, and nothing from it is written into the page.
 */
const LANG_SCRIPT = `(function(){if(/^\\/en(\\/|$)/.test(location.pathname)){var d=document.documentElement;d.lang="en";d.setAttribute("data-lang","en")}})()`
const LANG_CSS = `html:not([data-lang="en"]) [data-for="en"],html[data-lang="en"] [data-for="vi"]{display:none}`

/** One language's 404: its words and links first, then a line pointing to the other language. */
function Version({ lang }: { lang: Locale }) {
  const t = dictionaries[lang].common.notFound
  const prefix = lang === 'vi' ? '' : '/en'
  return (
    <div data-for={lang} lang={lang} className="flex flex-col items-center gap-6">
      <Logo className="h-20 w-20 animate-wiggle" />
      <p className="font-display text-7xl font-extrabold text-brand">404</p>
      <h1 className="font-display text-4xl leading-tight font-extrabold text-balance">{t.title}</h1>
      <p className="max-w-md text-lg leading-relaxed text-pretty text-muted">{t.body}</p>
      <p className="flex flex-wrap justify-center gap-3">
        <Link href={prefix || '/'} className="btn btn-buy">
          {t.home}
        </Link>
        <Link href={`${prefix}/menu`} className="btn btn-ghost">
          {t.menu}
        </Link>
      </p>
      <p lang={t.other.lang} className="mt-4 border-t border-line pt-6 text-muted">
        {t.other.lead}{' '}
        <Link href={t.other.href} className="font-semibold text-leaf underline underline-offset-4">
          {t.other.link}
        </Link>
      </p>
    </div>
  )
}

/**
 * Any address that matches no page. It renders outside the [lang] layout and is prerendered once, so the server
 * cannot tell the language: the page holds the Vietnamese and the English version, and `LANG_SCRIPT` picks the
 * English one for `/en/...` (Vietnamese without JavaScript).
 */
export default function GlobalNotFound() {
  return (
    <html
      lang="vi"
      data-palette={DEFAULT_PALETTE}
      className={`${baloo.variable} ${beVietnam.variable}`}
      suppressHydrationWarning
    >
      <head>
        <PaletteHead />
        <script dangerouslySetInnerHTML={{ __html: LANG_SCRIPT }} />
        <style dangerouslySetInnerHTML={{ __html: LANG_CSS }} />
      </head>
      <body>
        <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <Version lang="vi" />
          <Version lang="en" />
        </main>
      </body>
    </html>
  )
}
