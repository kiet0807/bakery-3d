'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useDict } from '@/i18n/LangProvider'
import { Logo } from '../Logo'

const noSubscription = () => () => {}

/**
 * The welcome screen. Content first: the way in is there at once, and a quiet line under it says how the 3D
 * scene is coming along (real loading progress), so nobody waits on a download to read the page. Starting is
 * a deliberate click, so the opening animation plays while they are looking, whenever the cake arrives.
 */
export function IntroGate({
  percent,
  ready,
  onStart,
  leaving,
}: {
  percent: number
  /** The cake is on screen behind the gate, lit and waiting. */
  ready: boolean
  onStart: () => void
  leaving: boolean
}) {
  const { home, common } = useDict()
  const t = home.intro
  const dialog = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  // The server's HTML has the button too, but a click before the page has hydrated would do nothing: it keeps
  // its place, hidden, and pops in the moment it works (well under a second, long before the 3D scene).
  const hydrated = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  )
  // The start button takes focus as soon as it works, so Enter (or a screen reader) goes straight in. It shows the
  // focus ring only to someone using the keyboard: browsers draw it for any focus moved by script before the
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
    if (hydrated) button.current?.focus(options)
  }, [hydrated])
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
      id="intro-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
      aria-describedby="intro-tagline"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 overflow-hidden px-6 text-center transition-[opacity,scale] duration-700 ease-out ${
        leaving ? 'pointer-events-none scale-[1.06] opacity-0' : 'opacity-100'
      }`}
    >
      {/* Without JavaScript nothing could close the gate: the page shows as it is, story words and all. */}
      <noscript>
        <style>{'#intro-gate{display:none}'}</style>
      </noscript>
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
      <p
        id="intro-tagline"
        className="max-w-md animate-rise text-lg text-balance text-muted [animation-delay:200ms]"
      >
        {t.tagline}
      </p>
      <div className="flex animate-rise flex-col items-center gap-3 [animation-delay:280ms]">
        <button
          ref={button}
          type="button"
          onClick={onStart}
          className={`btn btn-buy px-9 py-3.5 text-lg ${hydrated ? 'animate-pop' : 'invisible'}`}
        >
          {t.start}
        </button>
        {/*
          Only the words are announced, once, when the scene is ready; the number moving is for the eyes. Until
          the canvas has drawn, the count stops at 99 (the downloads can be done before the cake is on screen).
        */}
        <p className="flex h-5 items-center gap-2 text-sm font-medium text-muted">
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full transition-colors duration-500 ${
              ready ? 'bg-leaf' : 'bg-edge motion-safe:animate-pulse'
            }`}
          />
          <span role="status">{ready ? t.ready : t.loading}</span>
          {!ready && percent > 0 && (
            <span aria-hidden className="tabular-nums">
              · {Math.min(percent, 99)}%
            </span>
          )}
        </p>
      </div>
      <p className="max-w-sm animate-rise text-sm text-pretty text-muted [animation-delay:360ms]">
        <span className="chip mr-1.5 -rotate-2 border border-ink/80">
          <span aria-hidden>✦</span> {common.notice.badge}
        </span>
        {t.notice}
      </p>
    </div>
  )
}
