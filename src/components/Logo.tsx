import { SHOP } from '@/lib/shop'
import type { Locale } from '@/i18n/config'

/** A little sticker cake: mint frosting, a peach filling stripe and a cherry on top. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="5.5"
        y="14"
        width="21"
        height="12.5"
        rx="3"
        fill="#fff8e5"
        stroke="#1f3d36"
        strokeWidth="1.8"
      />
      <path d="M5.5 20.2h21" stroke="#ffb38a" strokeWidth="2.2" />
      <path
        d="M5.5 16.4c0-2 1.4-3.1 3-3.1h15c1.6 0 3 1.1 3 3.1v1c-1.3 1.6-2.6 1.6-3.5 0-.9 1.6-2.6 1.6-3.5 0-.9 1.6-2.6 1.6-3.5 0-.9 1.6-2.6 1.6-3.5 0-.9 1.6-2.6 1.6-3.5 0-.9 1.6-2.2 1.6-3.5 0z"
        fill="#8ed9c2"
        stroke="#1f3d36"
        strokeWidth="1.8"
      />
      <circle cx="16" cy="9.6" r="3" fill="#f2789f" stroke="#1f3d36" strokeWidth="1.8" />
      <path d="M16 6.6c.6-1.6 1.8-2.5 3.2-2.7" stroke="#1f3d36" strokeWidth="1.6" />
    </svg>
  )
}

/** "Kai's" in the script face with the shop's line under it. Decorative: pair it with an accessible name. */
export function Wordmark({ lang, className = '' }: { lang: Locale; className?: string }) {
  return (
    <span className={`flex flex-col leading-none ${className}`} aria-hidden>
      <span className="font-script text-[1.55rem] leading-[1.05] text-buy">Kai&apos;s</span>
      <span className="font-display text-[0.62rem] font-bold tracking-[0.14em] whitespace-nowrap text-muted uppercase">
        Bakery · {SHOP.tagline[lang]}
      </span>
    </span>
  )
}
