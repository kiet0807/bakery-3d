'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useSyncExternalStore, type RefObject } from 'react'
import { LOCALES, localeHref, stripLocale } from '@/i18n/config'
import { LocalLink, useDict, useLang } from '@/i18n/LangProvider'
import { countItems } from '@/lib/cart'
import { useCart } from '@/lib/store'
import { Logo, Wordmark } from './Logo'
import { MobileNav } from './MobileNav'
import { PaletteSwitcher } from './PaletteSwitcher'

function subscribeScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true })
  return () => window.removeEventListener('scroll', onChange)
}
const readScrolled = () => window.scrollY > 8

const subscribeHydration = (onChange: () => void) => useCart.persist.onFinishHydration(onChange)
const readHydrated = () => useCart.persist.hasHydrated()

/**
 * The cart count swells and settles when a cake goes in, so the header answers the "Add to cart" press even when
 * the cart button is far from it. Not when the saved cart arrives on page load (that is not news), and not for
 * someone who asked for less motion.
 */
function useCountBump(badge: RefObject<HTMLSpanElement | null>, count: number) {
  const hydrated = useSyncExternalStore(subscribeHydration, readHydrated, () => false)
  const seen = useRef<number | null>(null)
  useEffect(() => {
    if (!hydrated) return
    const before = seen.current
    seen.current = count
    if (before === null || count <= before) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    badge.current?.animate([{ scale: 1 }, { scale: 1.35, offset: 0.3 }, { scale: 1 }], {
      duration: 550,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    })
  }, [badge, count, hydrated])
}

export function SiteHeader() {
  const badge = useRef<HTMLSpanElement>(null)
  const lang = useLang()
  const { common } = useDict()
  // The proxy serves Vietnamese pages from /vi/…, so the pathname may carry either prefix or none.
  const path = stripLocale(usePathname() ?? '/')
  const count = useCart((state) => countItems(state.items))
  // Once the page moves, the header gets a frosted backing so content never runs under the links.
  const scrolled = useSyncExternalStore(subscribeScroll, readScrolled, () => false)
  useCountBump(badge, count)
  const other = LOCALES.find((l) => l !== lang) ?? 'en'
  const links = [
    { href: '/design', label: common.nav.design },
    { href: '/menu', label: common.nav.menu },
    { href: '/about', label: common.nav.about },
  ]
  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled ? 'border-b border-line bg-cream/85 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      {/*
        Widths, measured 2026-11-20 with the colour switch in (320, 360, 390, 412, 430, 640, 700, 768, 1024, both
        languages): below 640 the cart is a bag icon with its count, and the links move into one button (MobileNav,
        2026-11-23: "Design" used to be missing there). The name is always there: "Kai's Bakery" below 768 (at least 26 px to spare), the full line with
        the tagline from 768 (176 px wide, it overflowed phones under about 430). Links never wrap.
      */}
      <nav
        aria-label={common.nav.label}
        className="mx-auto flex h-16 max-w-7xl items-center gap-1 px-4 max-[359px]:gap-0.5 max-[359px]:px-2.5 sm:h-20 sm:gap-2 sm:px-8"
      >
        <LocalLink
          href="/"
          aria-label={common.nav.home}
          className="mr-auto flex items-center gap-2 rounded-xl"
        >
          <Logo className="h-9 w-9 shrink-0 max-[359px]:h-8 max-[359px]:w-8 sm:h-10 sm:w-10" />
          <Wordmark lang={lang} taglineClassName="hidden md:inline" />
        </LocalLink>
        <LocalLink
          href="/about#project"
          className="chip mr-1 hidden -rotate-2 border border-ink/80 transition-transform duration-500 ease-spring hover:rotate-0 lg:inline-flex"
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
              className={`hidden rounded-full px-3 py-1.5 font-display text-[0.95rem] font-semibold whitespace-nowrap transition-colors hover:bg-butter-soft sm:inline-flex ${
                active ? 'bg-soft text-leaf' : 'text-ink'
              }`}
            >
              {link.label}
            </LocalLink>
          )
        })}
        <PaletteSwitcher />
        {/*
          A plain link on purpose: the other language has its own root layout, so switching is a full page load
          anyway, and a router prefetch of a Vietnamese page from an English one goes through the proxy's rewrite
          and comes back 404 (segment prefetch), which logs an error on every English page.
        */}
        <a
          href={localeHref(other, path)}
          hrefLang={other}
          lang={other}
          aria-label={common.otherLang.label}
          className="tap relative flex h-8 items-center rounded-full border-2 border-ink/15 px-2 font-display text-sm font-bold text-muted transition-colors hover:border-ink hover:text-ink sm:px-2.5"
        >
          {common.otherLang.short}
        </a>
        {/* On phones a bag icon with the count on its corner; the word stays for screen readers. */}
        <LocalLink
          href="/cart"
          aria-current={path === '/cart' ? 'page' : undefined}
          className="btn btn-ghost relative ml-1 h-9 w-10 px-0 py-1.5 text-sm max-[359px]:ml-0.5 sm:h-auto sm:w-auto sm:px-4"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-5 w-5 sm:hidden"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" />
            <path d="M9 10.5V7a3 3 0 0 1 6 0v3.5" />
          </svg>
          <span className="max-sm:sr-only">{common.nav.cart}</span>
          <span className="sr-only">{common.nav.cartCount(count)}</span>
          <span
            ref={badge}
            aria-hidden
            className="grid h-5 min-w-5 place-items-center rounded-full bg-buy px-1.5 text-xs font-bold text-white max-sm:absolute max-sm:-top-2 max-sm:-right-2 max-sm:border-2 max-sm:border-cream"
          >
            {count}
          </span>
        </LocalLink>
        <MobileNav />
      </nav>
    </header>
  )
}
