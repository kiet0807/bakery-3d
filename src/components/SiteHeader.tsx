'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSyncExternalStore } from 'react'
import { LOCALES, localeHref, stripLocale } from '@/i18n/config'
import { LocalLink, useDict, useLang } from '@/i18n/LangProvider'
import { countItems } from '@/lib/cart'
import { useCart } from '@/lib/store'
import { Logo, Wordmark } from './Logo'

function subscribeScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true })
  return () => window.removeEventListener('scroll', onChange)
}
const readScrolled = () => window.scrollY > 8

export function SiteHeader() {
  const lang = useLang()
  const { common } = useDict()
  // The proxy serves Vietnamese pages from /vi/…, so the pathname may carry either prefix or none.
  const path = stripLocale(usePathname() ?? '/')
  const count = useCart((state) => countItems(state.items))
  // Once the page moves, the header gets a frosted backing so content never runs under the links.
  const scrolled = useSyncExternalStore(subscribeScroll, readScrolled, () => false)
  const other = LOCALES.find((l) => l !== lang) ?? 'en'
  const links = [
    { href: '/design', label: common.nav.design },
    { href: '/menu', label: common.nav.menu },
    { href: '/about', label: common.nav.about, hideOnSmall: true },
  ]
  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled ? 'border-b border-line bg-cream/85 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <nav
        aria-label={common.nav.label}
        className="mx-auto flex h-16 max-w-7xl items-center gap-1 px-4 sm:h-20 sm:gap-2 sm:px-8"
      >
        <LocalLink
          href="/"
          aria-label={common.nav.home}
          className="mr-auto flex items-center gap-2 rounded-xl"
        >
          <Logo className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
          <Wordmark lang={lang} className="hidden min-[400px]:flex" />
        </LocalLink>
        <LocalLink
          href="/about#project"
          className="chip mr-1 hidden -rotate-2 border border-ink/80 transition-transform hover:rotate-0 lg:inline-flex"
          title={common.notice.short}
        >
          <span aria-hidden>✦</span> {common.notice.badge}
        </LocalLink>
        {links.map((link) => {
          const active = path === link.href
          return (
            <LocalLink
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={`rounded-full px-2.5 py-1.5 font-display text-[0.95rem] font-semibold transition-colors hover:bg-butter-soft sm:px-3 ${
                active ? 'bg-soft text-leaf' : 'text-ink'
              } ${link.hideOnSmall ? 'hidden sm:inline-flex' : ''}`}
            >
              {link.label}
            </LocalLink>
          )
        })}
        <Link
          href={localeHref(other, path)}
          hrefLang={other}
          lang={other}
          aria-label={common.otherLang.label}
          className="rounded-full border-2 border-ink/15 px-2.5 py-1 font-display text-sm font-bold text-muted transition-colors hover:border-ink hover:text-ink"
        >
          {common.otherLang.short}
        </Link>
        <LocalLink
          href="/cart"
          aria-current={path === '/cart' ? 'page' : undefined}
          className="btn btn-ghost ml-1 px-3.5 py-1.5 text-sm sm:px-4"
        >
          {common.nav.cart}
          <span
            aria-label={common.nav.cartCount(count)}
            className="grid h-5 min-w-5 place-items-center rounded-full bg-buy px-1.5 text-xs font-bold text-white"
          >
            {count}
          </span>
        </LocalLink>
      </nav>
    </header>
  )
}
