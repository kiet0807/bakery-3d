'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { stripLocale } from '@/i18n/config'
import { LocalLink, useDict } from '@/i18n/LangProvider'

/**
 * Every page of the shop behind one button, below `sm` where the header has no room for links: a disclosure that
 * opens a card under the header (the same card as the colour switch). Choosing a link, Esc, a press outside, tabbing
 * out or moving to another page closes it.
 */
export function MobileNav() {
  const { common } = useDict()
  const pathname = usePathname()
  const path = stripLocale(pathname ?? '/')
  // Open on the page it was opened on: going anywhere else closes it without an effect.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn !== null && openOn === pathname
  const wrapper = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const panel = `${useId()}panel`

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpenOn(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const t = common.nav
  const links = [
    { href: '/design', label: common.footer.links.design },
    { href: '/menu', label: common.footer.links.menu },
    { href: '/about', label: common.footer.links.about },
    { href: '/policies', label: common.footer.links.policies },
    { href: '/faq', label: common.footer.links.faq },
  ]
  return (
    <div
      ref={wrapper}
      className="sm:hidden"
      onBlur={(event) => {
        if (open && event.relatedTarget && !wrapper.current?.contains(event.relatedTarget as Node))
          setOpenOn(null)
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !open) return
        event.preventDefault()
        setOpenOn(null)
        button.current?.focus()
      }}
    >
      <button
        ref={button}
        type="button"
        aria-label={t.all}
        aria-expanded={open}
        aria-controls={panel}
        onClick={() => setOpenOn(open ? null : pathname)}
        className="tap relative ml-1 grid h-9 w-9 place-items-center rounded-full border-2 border-ink/15 bg-surface/70 text-ink transition-colors hover:border-ink aria-expanded:border-ink max-[359px]:ml-0.5"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          {/* Two bars that cross into an X. */}
          <path
            d="M5 8.5h14"
            className={`origin-center transition-[translate,rotate] transform-fill duration-300 ease-out ${open ? 'translate-y-[3.5px] rotate-45' : ''}`}
          />
          <path
            d="M5 15.5h14"
            className={`origin-center transition-[translate,rotate] transform-fill duration-300 ease-out ${open ? '-translate-y-[3.5px] -rotate-45' : ''}`}
          />
        </svg>
      </button>

      {/* Invisible rather than unmounted when closed: it leaves as smoothly as it came (see PaletteSwitcher). */}
      <div
        id={panel}
        className={`fixed inset-x-3 top-[4.25rem] z-50 origin-top rounded-[1.75rem] border-2 border-ink bg-surface p-3 shadow-sticker-lg ${
          open
            ? 'visible transition-[opacity,scale,translate] duration-[260ms] ease-out'
            : 'pointer-events-none invisible -translate-y-1.5 scale-95 opacity-0 transition-[opacity,scale,translate,visibility] duration-150 ease-in'
        }`}
      >
        <ul className="grid gap-1">
          {links.map((link) => {
            const active = path === link.href
            return (
              <li key={link.href}>
                <LocalLink
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setOpenOn(null)}
                  className={`flex min-h-12 items-center rounded-2xl border-2 px-4 font-display text-lg font-bold transition-colors ${
                    active ? 'border-ink bg-soft text-leaf' : 'border-transparent hover:bg-butter-soft'
                  }`}
                >
                  {link.label}
                </LocalLink>
              </li>
            )
          })}
        </ul>
        <p className="mt-2 rounded-2xl bg-butter-soft px-4 py-3 text-sm leading-snug">
          <span className="chip mr-1.5 -rotate-1 border border-ink/70">
            <span aria-hidden>✦</span> {common.notice.badge}
          </span>
          {common.notice.short}
        </p>
      </div>
    </div>
  )
}
