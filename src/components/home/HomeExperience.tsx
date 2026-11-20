'use client'

import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { CHAPTERS } from './chapters'
import { IntroGate } from './IntroGate'

const StoryScene = dynamic(() => import('../three/scenes/StoryScene'), { ssr: false })

const SEEN_KEY = 'crumb-cloud-intro-seen'

const noSubscription = () => () => {}

function readSeen() {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * The home page: a sticky 3D stage behind a column of chapters. Scrolling sets a continuous chapter number
 * (2.5 = halfway between chapters 2 and 3) that the camera follows.
 */
export function HomeExperience() {
  const reduced = useReducedMotion()
  const chapterRef = useRef(0)
  const sections = useRef<(HTMLElement | null)[]>([])
  const title = useRef<HTMLHeadingElement>(null)
  const tint = useRef<HTMLDivElement>(null)
  const shade = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [inStory, setInStory] = useState(true)
  const [percent, setPercent] = useState(0)
  // Returning in the same visit: skip the welcome screen. Read from sessionStorage after hydration.
  const seen = useSyncExternalStore(noSubscription, readSeen, () => false)
  const [gateState, setGate] = useState<'open' | 'leaving' | 'closed'>('open')
  const [startedState, setStarted] = useState(false)
  const gate = seen && gateState === 'open' ? 'closed' : gateState
  const started = seen || startedState

  const onProgress = useCallback((value: number) => setPercent((current) => Math.max(current, value)), [])

  // Safety net: if the scene never reports back (a stalled download, a scene chunk that failed), the welcome
  // screen still lets the visitor in.
  useEffect(() => {
    const timer = window.setTimeout(() => onProgress(100), 15000)
    return () => window.clearTimeout(timer)
  }, [onProgress])

  const start = () => {
    try {
      window.sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      // Private mode: the gate simply shows again next time.
    }
    setStarted(true)
    setGate('leaving')
    window.setTimeout(() => setGate('closed'), 750)
  }

  // Smooth scrolling once the visitor is in, unless they asked for less motion.
  useEffect(() => {
    if (!started || reduced) return
    const lenis = new Lenis({ autoRaf: true, lerp: 0.085, smoothWheel: true })
    return () => lenis.destroy()
  }, [started, reduced])

  // One loop reads the scroll position and turns it into the chapter number.
  useEffect(() => {
    let frame = 0
    let last = -1
    let lastIn = true
    const tick = () => {
      const middle = window.scrollY + window.innerHeight / 2
      const centres = sections.current.map((element) =>
        element ? element.offsetTop + element.offsetHeight / 2 : 0,
      )
      let chapter = 0
      if (middle >= centres[centres.length - 1]) chapter = centres.length - 1
      else
        for (let i = 0; i < centres.length - 1; i++) {
          if (middle >= centres[i] && middle < centres[i + 1]) {
            chapter = i + (middle - centres[i]) / (centres[i + 1] - centres[i])
            break
          }
        }
      chapterRef.current = chapter
      const rounded = Math.round(chapter)
      if (rounded !== last) {
        last = rounded
        setActive(rounded)
      }
      const within = middle < centres[centres.length - 1] + window.innerHeight * 0.6
      if (within !== lastIn) {
        lastIn = within
        setInStory(within)
      }
      if (title.current) {
        const fade = Math.min(1, chapter * 2.2)
        title.current.style.opacity = String(1 - fade)
        title.current.style.transform = `translateY(${-fade * 12}vh) scale(${1 + fade * 0.06})`
      }
      if (shade.current) {
        // Darken the side the chapter text sits on, only while chapters are on screen.
        const on =
          Math.min(1, Math.max(0, (chapter - 0.45) * 3)) * Math.min(1, Math.max(0, (4.55 - chapter) * 3))
        shade.current.style.opacity = String(on)
      }
      if (tint.current) {
        // Inside the cake the night turns to warm cocoa.
        const inside = Math.max(0, 1 - Math.abs(chapter - 1.6) / 1.1)
        tint.current.style.opacity = String(Math.min(1, inside * 1.2))
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  const goTo = (index: number) => {
    sections.current[index]?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
  }

  return (
    <div className="relative" id="story">
      {gate !== 'closed' && <IntroGate percent={percent} onStart={start} leaving={gate === 'leaving'} />}

      <div
        className="pointer-events-none sticky top-0 h-[100svh] overflow-hidden"
        aria-hidden={gate === 'open'}
      >
        <div
          ref={tint}
          className="absolute inset-0 bg-[radial-gradient(120%_90%_at_60%_50%,#6a4434_0%,#33201a_45%,#120b09_100%)] opacity-0"
        />
        <h1
          ref={title}
          className="text-gradient absolute inset-x-0 top-[13svh] text-center font-display text-[clamp(4.2rem,17vw,16rem)] leading-[0.82] font-extralight tracking-[0.02em] uppercase will-change-transform"
        >
          Crumb <span className="font-light">&</span>
          <br />
          Cloud
        </h1>
        <div className="absolute inset-0">
          <StoryScene chapterRef={chapterRef} started={started} onProgress={onProgress} />
        </div>
        <div
          ref={shade}
          className="absolute inset-y-0 left-0 hidden w-[64%] bg-gradient-to-r from-night/90 via-night/55 to-transparent opacity-0 sm:block"
        />
      </div>

      <div className="relative z-10 -mt-[100svh]">
        {CHAPTERS.map((chapter, index) => {
          const register = (element: HTMLElement | null) => {
            sections.current[index] = element
          }
          if (chapter.id === 'intro')
            return (
              <section
                key={chapter.id}
                ref={register}
                aria-label="Introduction"
                className="flex h-[100svh] flex-col items-center justify-end gap-5 px-6 pb-[5svh] text-center"
              >
                <p className="max-w-md text-[clamp(1.4rem,2.6vw,2rem)] leading-tight font-light [text-shadow:0_1px_2px_rgb(6_8_20/0.9),0_2px_28px_rgb(6_8_20/0.95)]">
                  Cakes, built in 3D.
                  <br />
                  <span className="text-ink/85">Scroll to dive into the layers.</span>
                </p>
                <button
                  type="button"
                  onClick={() => goTo(1)}
                  aria-label="Scroll to the first chapter"
                  className="grid h-12 w-12 place-items-center rounded-full bg-ink text-night shadow-glow transition-transform hover:translate-y-1"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </section>
            )
          if (chapter.id === 'build')
            return (
              <section
                key={chapter.id}
                ref={register}
                aria-labelledby="build-title"
                className="flex min-h-[115svh] flex-col items-center justify-end gap-7 px-6 pb-[9svh] text-center [text-shadow:0_2px_24px_rgb(3_11_23/0.9)]"
              >
                <p className="eyebrow">05 — Yours</p>
                <h2
                  id="build-title"
                  className="max-w-3xl text-[clamp(2.4rem,6vw,5rem)] leading-[1] font-light tracking-tight"
                >
                  Now, <span className="text-accent">build yours.</span>
                </h2>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/design"
                    className="rounded-full bg-ink px-8 py-3.5 text-sm font-semibold tracking-[0.12em] text-night uppercase shadow-glow transition-transform hover:-translate-y-0.5"
                  >
                    Build your cake
                  </Link>
                  <Link
                    href="/menu"
                    className="rounded-full border border-white/40 px-8 py-3.5 text-sm font-medium tracking-[0.12em] uppercase transition-colors hover:border-moon hover:text-moon"
                  >
                    Visit the vitrine
                  </Link>
                </div>
              </section>
            )
          return (
            <section
              key={chapter.id}
              ref={register}
              aria-labelledby={`${chapter.id}-title`}
              className="flex min-h-[135svh] items-end px-5 pb-[10svh] sm:items-center sm:px-[7vw] sm:pb-0"
            >
              <div className="max-w-xl rounded-3xl bg-gradient-to-t from-night/85 to-night/40 p-5 backdrop-blur-[2px] sm:bg-none sm:p-0 sm:backdrop-blur-none">
                <p className="eyebrow mb-5">{chapter.eyebrow}</p>
                <h2
                  id={`${chapter.id}-title`}
                  className="text-[clamp(1.9rem,4.1vw,3.6rem)] leading-[1.08] font-light tracking-tight"
                >
                  {chapter.lead}
                  <span className="text-accent">{chapter.accent}</span>
                  {chapter.tail}
                </h2>
                {chapter.note && (
                  <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-mist">{chapter.note}</p>
                )}
              </div>
            </section>
          )
        })}
      </div>

      <nav
        aria-label="Chapters"
        className={`fixed top-1/2 right-5 z-30 hidden -translate-y-1/2 transition-opacity duration-500 lg:block ${
          inStory && gate === 'closed' ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <ol className="space-y-3 text-right">
          {CHAPTERS.map((chapter, index) => (
            <li key={chapter.id}>
              <button
                type="button"
                onClick={() => goTo(index)}
                aria-current={active === index ? 'step' : undefined}
                className={`group flex w-full items-center justify-end gap-3 text-sm tracking-wide transition-colors ${
                  active === index ? 'text-ink' : 'text-haze hover:text-mist'
                }`}
              >
                {chapter.nav}
                <span
                  className={`h-px transition-all ${active === index ? 'w-8 bg-moon' : 'w-4 bg-haze group-hover:w-6'}`}
                />
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  )
}
