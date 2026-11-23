import type { ReactNode } from 'react'
import type { IconName } from '@/lib/icons'

/**
 * Little stickers in the logo's hand: ink outline, pastel fills from the tokens, so they follow the palette and look
 * the same on every device (emoji were drawn by each system in its own style, next to a logo that was not).
 */
const DRAWINGS: Record<IconName, ReactNode> = {
  /** A slice, the logo's cake cut open. */
  cake: (
    <>
      <path d="M5 15h22v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" className="fill-cream stroke-ink" />
      <path d="M7.4 20.6h17.2" className="stroke-peach" strokeWidth="2.6" />
      <path d="M5 15 19.6 8.6c4-.5 7.4 2.4 7.4 6.4z" className="fill-mint stroke-ink" />
      <circle cx="18.6" cy="7.2" r="2.8" className="fill-berry stroke-ink" />
    </>
  ),
  /** Whipped cream in a bowl. */
  cream: (
    <>
      <path
        d="M8 17.4c-.9-3 1.1-5.2 3.9-5.2-.2-3.2 2.5-4.6 4.6-7 .4 2.6 3.9 3.5 3.5 7 3 0 4.9 2.3 4 5.2z"
        className="fill-surface stroke-ink"
      />
      <path d="M11.9 12.2c2.6 1 5.6 1 8.1 0" className="stroke-ink" />
      <path d="M4.5 17.4h23c0 5.4-4.6 9.2-11.5 9.2S4.5 22.8 4.5 17.4z" className="fill-mint stroke-ink" />
    </>
  ),
  /** A pencil and the line it wrote. */
  pen: (
    <>
      <path
        d="m6 25.8 1.5-6L20.4 6.9a3 3 0 0 1 4.2 0l.5.5a3 3 0 0 1 0 4.2L12.1 24.4z"
        className="fill-butter stroke-ink"
      />
      <path d="m18.2 9.1 4.7 4.7" className="stroke-ink" />
      <path d="M16.5 26.4H27" className="stroke-berry" strokeWidth="2.6" />
    </>
  ),
  /** A cake that turns. */
  turn: (
    <>
      <path
        d="M9.5 13.6h13v6.6a1.8 1.8 0 0 1-1.8 1.8h-9.4a1.8 1.8 0 0 1-1.8-1.8z"
        className="fill-peach stroke-ink"
      />
      <path
        d="M9.5 13.8c0-1.9 1.2-3 3-3h7c1.8 0 3 1.1 3 3v1.1c-1.4 1.6-2.4 1.6-3.2 0-1.1 1.6-2.2 1.6-3.3 0-1.1 1.6-2.2 1.6-3.3 0-.8 1.6-1.8 1.6-3.2 0z"
        className="fill-cream stroke-ink"
      />
      <circle cx="16" cy="7.8" r="2.4" className="fill-berry stroke-ink" />
      <path d="M4.6 17.6c0 4.8 5.1 8.6 11.4 8.6s11.4-3.8 11.4-8.6" className="stroke-ink" />
      <path d="m23.9 20.2 3.4-3 2.5 3.6" className="stroke-ink" />
    </>
  ),
  clock: (
    <>
      <path d="m8 5.8-3.4 3.3M24 5.8l3.4 3.3" className="stroke-ink" />
      <circle cx="16" cy="17" r="10" className="fill-butter-soft stroke-ink" />
      <path d="M16 11.4V17l3.8 2.5" className="stroke-ink" />
    </>
  ),
  /** The delivery scooter, the cake box on its back. */
  scooter: (
    <>
      <path d="M4.5 11.2h9.2v6.6H4.5z" className="fill-peach stroke-ink" />
      <path d="M9.1 11.2v6.6" className="stroke-ink" />
      <path
        d="M4.6 23.8c0-3.6 2.2-6 5.4-6h5.6c1 0 1.7.7 2 1.7l.8 2.3c1.9-.4 3.2-2 3.6-4.3l.4-2.4 3.6 8.7h-5.2z"
        className="fill-mint stroke-ink"
      />
      <path d="M22.6 15.4 21 7.6h-3.2" className="stroke-ink" />
      <circle cx="9" cy="24" r="3.2" className="fill-surface stroke-ink" />
      <circle cx="24.4" cy="24" r="3.2" className="fill-surface stroke-ink" />
    </>
  ),
  letter: (
    <>
      <rect x="4.5" y="7.5" width="23" height="18" rx="3" className="fill-surface stroke-ink" />
      <path d="m5.4 9.4 10.6 8 10.6-8" className="stroke-ink" />
      <path
        d="M16 24.2c-2.9-1.8-4-3.1-4-4.6 0-2.1 2.7-2.6 4-.7 1.3-1.9 4-1.4 4 .7 0 1.5-1.1 2.8-4 4.6z"
        className="fill-berry stroke-ink"
      />
    </>
  ),
  palette: (
    <>
      <path
        d="M16 5.2C9.6 5.2 4.6 9.7 4.6 15.8s4.8 10.9 10.6 10.9c2 0 2.6-1.3 2.2-2.7-.5-1.8.4-3.1 2.3-3.1h2.2c3 0 5.5-1.9 5.5-5.2 0-6.1-5-10.5-11.4-10.5z"
        className="fill-cream stroke-ink"
      />
      <circle cx="10.4" cy="12.4" r="1.9" className="fill-berry" />
      <circle cx="16.4" cy="10" r="1.9" className="fill-butter" />
      <circle cx="22.2" cy="13.2" r="1.9" className="fill-mint" />
      <circle cx="9.8" cy="18.6" r="1.9" className="fill-peach" />
    </>
  ),
}

/** Decorative: the words next to it carry the meaning. `bold` keeps the outline visible at text size. */
export function Icon({
  name,
  className = 'h-8 w-8',
  bold = false,
}: {
  name: IconName
  className?: string
  bold?: boolean
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      fill="none"
      strokeWidth={bold ? 2.8 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      {DRAWINGS[name]}
    </svg>
  )
}
