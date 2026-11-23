'use client'

import { useEffect, useState, type RefObject } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useOnce } from '@/hooks/useOnce'
import { useDict } from '@/i18n/LangProvider'

/** A beat after the cake appears, so the hint is not lost in the canvas fading in. */
const SHOW_AFTER_MS = 700
/** Long enough to read twice; any touch, click or wheel on the stage ends it sooner. */
const SHOW_FOR_MS = 6500
/** The fade out, matched to the transition below. */
const LEAVE_MS = 260

type Phase = 'waiting' | 'in' | 'out' | 'gone'

/**
 * Tells a first-time visitor, once per browser, that the cake turns: drag to spin it, wheel or pinch to zoom. It
 * sits above the stage's buttons and lets every pointer event through (so it never covers a control), and it is
 * hidden from screen readers: the scene is a picture to them, with nothing to drag.
 */
export function DragHint({
  ready,
  stageRef,
}: {
  /** The live 3D scene has drawn: no hint over the loading poster or the 2D drawing. */
  ready: boolean
  /** The stage whose first touch, click or wheel ends the hint. */
  stageRef: RefObject<HTMLElement | null>
}) {
  const t = useDict().design.stage.hint
  const reduced = useReducedMotion()
  const { due, start, done } = useOnce('drag')
  const [phase, setPhase] = useState<Phase>('waiting')

  useEffect(() => {
    if (!ready || !due || phase !== 'waiting') return
    // Another hint may have taken the screen meanwhile (the colour switch's): then this one waits its turn.
    const timer = window.setTimeout(() => start() && setPhase('in'), SHOW_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [ready, due, phase, start])

  useEffect(() => {
    if (phase !== 'in') return
    const stage = stageRef.current
    const leave = () => setPhase('out')
    const timer = window.setTimeout(leave, SHOW_FOR_MS)
    stage?.addEventListener('pointerdown', leave)
    stage?.addEventListener('wheel', leave, { passive: true })
    return () => {
      window.clearTimeout(timer)
      stage?.removeEventListener('pointerdown', leave)
      stage?.removeEventListener('wheel', leave)
    }
  }, [phase, stageRef])

  useEffect(() => {
    if (phase !== 'out') return
    const timer = window.setTimeout(() => setPhase('gone'), LEAVE_MS)
    return () => window.clearTimeout(timer)
  }, [phase])

  // Shown is shown: remembered once it has gone, or when the stage goes away while it is up (a new page, the
  // studio photo starting).
  const shown = phase !== 'waiting'
  useEffect(() => {
    if (phase === 'gone') done()
  }, [phase, done])
  useEffect(() => () => void (shown && done()), [shown, done])

  if (phase === 'waiting' || phase === 'gone') return null
  return (
    <div
      aria-hidden
      data-hint="drag"
      // Pops in on the spring (the pill's animation); fades out here, so the two never fight over opacity.
      className={`pointer-events-none absolute inset-x-3 bottom-16 flex justify-center transition-[opacity,translate] duration-[260ms] ease-in ${
        phase === 'out' ? 'translate-y-1 opacity-0' : ''
      }`}
    >
      <p className="flex animate-pop items-center gap-2 rounded-full border-2 border-ink bg-surface py-1.5 pr-3.5 pl-2 font-display text-sm leading-tight font-bold text-ink shadow-sticker">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-butter">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/*
              A small cake with a cherry inside a turning arrow: "it turns", readable at this size (the earlier cake on
              an orbit read like a flying saucer). The arrow rocks a little to and fro, like a hand turning the cake
              (not a full spin, which would read as "loading"); with reduced motion it stays still.
            */}
            <path d="M9 15v-2.6c0-.6.4-1 1-1h4c.6 0 1 .4 1 1V15M8 15h8" />
            <circle cx="12" cy="9.3" r="1.1" fill="currentColor" stroke="none" />
            <g>
              <path d="M20 12a8 8 0 1 1-2.4-5.7M20.2 3.6l-.2 3.3-3.3-.2" />
              {!reduced && (
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="-14 12 12;14 12 12;-14 12 12"
                  keyTimes="0;0.5;1"
                  calcMode="spline"
                  keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
              )}
            </g>
          </svg>
        </span>
        <span className="pointer-coarse:hidden">{t.mouse}</span>
        <span className="hidden pointer-coarse:inline">{t.touch}</span>
      </p>
    </div>
  )
}
