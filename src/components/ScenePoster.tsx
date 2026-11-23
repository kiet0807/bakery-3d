'use client'

import { useLayoutEffect, useRef } from 'react'
import { useDict } from '@/i18n/LangProvider'

/**
 * A scene on screen within this long never shows its poster: a poster up for a blink read as a flash. A slower
 * scene fades the poster in after it.
 */
const POSTER_DELAY_MS = 300
/** A poster arriving this soon after the last one went takes over from it, in the same wait. */
const HAND_OVER_MS = 100

/** The wait the posters on screen belong to: when it began, how many posters show it, when the last one went. */
const wait = { start: 0, posters: 0, lastGone: -Infinity }

/**
 * Shown while a 3D scene downloads, so the layout never jumps. One wait can take two posters, the page's (while the
 * scene's code loads) then the scene's own (until it has drawn): the second picks up the first one's fade where it
 * is, so the hand-over never blinks.
 */
export function ScenePoster({ label }: { label?: string }) {
  const { scenes } = useDict()
  const element = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const node = element.current
    if (!node) return
    const now = performance.now()
    if (wait.posters > 0 || now - wait.lastGone < HAND_OVER_MS) {
      // A negative delay starts the fade part-way through, or past its end.
      node.style.animationDelay = `${POSTER_DELAY_MS - (now - wait.start)}ms`
    } else {
      // A new wait. A poster from the server's page began fading when the page was first painted, not now.
      const started = node.getAnimations?.()[0]?.startTime
      wait.start = typeof started === 'number' ? started : now
    }
    wait.posters += 1
    return () => {
      wait.posters -= 1
      wait.lastGone = performance.now()
    }
  }, [])
  return (
    <div
      ref={element}
      className="flex h-full w-full animate-poster flex-col items-center justify-center gap-4"
      style={{ animationDelay: `${POSTER_DELAY_MS}ms` }}
      aria-hidden
    >
      <div className="relative h-24 w-24">
        <div className="absolute inset-0 animate-pulse rounded-full bg-mint/45" />
        <div className="absolute inset-5 animate-pulse rounded-full bg-peach/50 [animation-delay:300ms]" />
      </div>
      <p className="eyebrow">{label ?? scenes.loading}</p>
    </div>
  )
}
