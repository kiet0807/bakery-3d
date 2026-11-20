'use client'

import { useEffect, useRef } from 'react'
import { useDict } from '@/i18n/LangProvider'
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
  const { home, common } = useDict()
  const t = home.intro
  const dialog = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const ready = percent >= 100
  // The start button takes focus as soon as it appears, so Enter (or a screen reader) goes straight in. It shows
  // the focus ring only to someone using the keyboard: browsers draw it for any focus moved by script before the
  // first click, which looked like a stray outline around the button.
  const keyboard = useRef(false)
  useEffect(() => {
    const onKey = () => {
      keyboard.current = true
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => {
    // `focusVisible` is in Chromium, Firefox and Safari but not yet in TypeScript's DOM types.
    const options: FocusOptions & { focusVisible?: boolean } = { focusVisible: keyboard.current }
    if (ready) button.current?.focus(options)
  }, [ready])
  useEffect(() => {
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [])
  // A real modal: everything else on the page (header, story, footer) is made inert while the gate is up, so
  // Tab cannot wander to links hidden behind it. The gate sits inside <main>, so every ancestor's siblings
  // are covered, not just the top level.
  useEffect(() => {
    const made: Element[] = []
    for (
      let node: Element | null = dialog.current;
      node && node !== document.body;
      node = node.parentElement
    ) {
      for (const sibling of node.parentElement?.children ?? []) {
        if (sibling === node || sibling.hasAttribute('inert') || sibling.tagName === 'SCRIPT') continue
        sibling.setAttribute('inert', '')
        made.push(sibling)
      }
    }
    return () => made.forEach((element) => element.removeAttribute('inert'))
  }, [])

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
      aria-describedby="intro-tagline"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 overflow-hidden px-6 text-center transition-[opacity,transform] duration-700 ${
        leaving ? 'pointer-events-none scale-105 opacity-0' : 'opacity-100'
      }`}
    >
      <div aria-hidden className="absolute inset-0 -z-10 bg-cream">
        <div className="absolute -top-1/4 -left-1/4 h-[70vmax] w-[70vmax] animate-drift rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-mint)_55%,transparent),transparent)] blur-2xl" />
        <div className="absolute -right-1/4 -bottom-1/4 h-[65vmax] w-[65vmax] animate-drift rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-peach)_45%,transparent),transparent)] blur-2xl [animation-delay:-6s]" />
        <div className="absolute top-1/4 right-1/5 h-[36vmax] w-[36vmax] animate-drift rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-butter)_40%,transparent),transparent)] blur-2xl [animation-delay:-11s]" />
      </div>
      <Logo className="h-24 w-24 animate-rise" />
      <h2 id="intro-title" className="animate-rise font-display [animation-delay:120ms]">
        <span className="block text-2xl font-bold text-muted sm:text-3xl">{t.welcome}</span>
        <span className="block font-script text-[clamp(3.6rem,13vw,7.5rem)] leading-[1.15] font-normal text-brand">
          Kai&apos;s Bakery
        </span>
      </h2>
      <p id="intro-tagline" className="max-w-md animate-rise text-lg text-muted [animation-delay:200ms]">
        {t.tagline}
      </p>
      <div className="flex h-16 animate-rise items-center [animation-delay:280ms]">
        {ready ? (
          <button ref={button} type="button" onClick={onStart} className="btn btn-buy px-9 py-3.5 text-lg">
            {t.start}
          </button>
        ) : (
          <p className="eyebrow" aria-live="polite">
            {t.loading} · <span className="tabular-nums">{percent}%</span>
          </p>
        )}
      </div>
      <p className="max-w-sm animate-rise text-sm text-muted [animation-delay:360ms]">
        <span className="chip mr-1.5 -rotate-2 border border-ink/80">
          <span aria-hidden>✦</span> {common.notice.badge}
        </span>
        {t.notice}
      </p>
    </div>
  )
}
