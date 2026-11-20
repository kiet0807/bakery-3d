'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { countItems } from '@/lib/cart'
import { useCart } from '@/lib/store'
import { Logo } from './Logo'

const LINKS = [
  { href: '/design', label: 'Build a cake' },
  { href: '/menu', label: 'Vitrine' },
  { href: '/#story', label: 'Story', hideOnSmall: true },
]

export function SiteHeader() {
  const pathname = usePathname()
  const count = useCart((state) => countItems(state.items))
  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-night/80 via-night/40 to-transparent">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-7xl items-center gap-1 px-4 sm:h-20 sm:gap-3 sm:px-8"
      >
        <Link
          href="/"
          className="mr-auto flex items-center gap-2.5 rounded-md text-[1.05rem] font-medium tracking-wide"
        >
          <Logo className="h-8 w-8" />
          <span className="hidden min-[420px]:inline">Crumb & Cloud</span>
        </Link>
        {LINKS.map((link) => {
          const active = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={`rounded-md px-2.5 py-2 text-sm tracking-wide transition-colors hover:text-ink ${
                active ? 'text-moon' : 'text-mist'
              } ${link.hideOnSmall ? 'hidden sm:inline-flex' : ''}`}
            >
              {link.label}
            </Link>
          )
        })}
        <Link
          href="/cart"
          aria-current={pathname === '/cart' ? 'page' : undefined}
          className="ml-1 flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm font-medium tracking-wide transition-colors hover:border-moon hover:text-moon"
        >
          Cart
          <span
            aria-label={`${count} ${count === 1 ? 'cake' : 'cakes'} in the cart`}
            className="grid h-5 min-w-5 place-items-center rounded-full bg-glow px-1.5 text-xs font-semibold text-night"
          >
            {count}
          </span>
        </Link>
      </nav>
    </header>
  )
}
