'use client'

import { useEffect, useRef } from 'react'
import { Logo } from '../Logo'

/**
 * The welcome screen: shows real loading progress, then invites the visitor in. Starting is a deliberate
 * click so the opening animation plays while they are looking.
 */
export function IntroGate({
  percent,
  onStart,
  leaving,
}: {
  percent: number
  onStart: () => void
  leaving: boolean
}) {
  const button = useRef<HTMLButtonElement>(null)
  const ready = percent >= 100
  useEffect(() => {
    if (ready) button.current?.focus()
  }, [ready])
  useEffect(() => {
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-10 overflow-hidden px-6 text-center transition-[opacity,filter] duration-700 ${
        leaving ? 'pointer-events-none opacity-0 blur-md' : 'opacity-100'
      }`}
    >
      <div aria-hidden className="absolute inset-0 -z-10 bg-night">
        <div className="absolute -top-1/4 -left-1/4 h-[80vmax] w-[80vmax] animate-drift rounded-full bg-[radial-gradient(closest-side,rgb(28_42_120/0.9),transparent)] blur-3xl" />
        <div className="absolute -right-1/4 -bottom-1/4 h-[70vmax] w-[70vmax] animate-drift rounded-full bg-[radial-gradient(closest-side,rgb(91_124_255/0.34),transparent)] blur-3xl [animation-delay:-6s]" />
        <div className="absolute top-1/3 right-1/4 h-[40vmax] w-[40vmax] animate-drift rounded-full bg-[radial-gradient(closest-side,rgb(255_138_180/0.16),transparent)] blur-3xl [animation-delay:-11s]" />
      </div>
      <Logo className="h-20 w-20 animate-rise" />
      <h2
        id="intro-title"
        className="animate-rise text-5xl leading-[1.05] font-light tracking-tight sm:text-7xl [animation-delay:120ms]"
      >
        Welcome to
        <br />
        Crumb & Cloud
      </h2>
      <div className="h-14 animate-rise [animation-delay:240ms]">
        {ready ? (
          <button
            ref={button}
            type="button"
            onClick={onStart}
            className="rounded-full border border-white/50 px-10 py-3.5 text-sm font-medium tracking-[0.14em] uppercase transition-colors hover:border-moon hover:bg-moon/10 hover:text-moon"
          >
            Start the experience
          </button>
        ) : (
          <p className="eyebrow pt-4" aria-live="polite">
            Baking the scene · <span className="tabular-nums">{percent}%</span>
          </p>
        )}
      </div>
    </div>
  )
}
