'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { LocalLink, useDict } from '@/i18n/LangProvider'
import { scrollToElement } from '@/lib/smoothScroll'
import { CHAPTERS, isStoryChapter } from './chapters'
import { IntroGate } from './IntroGate'

const StoryScene = dynamic(() => import('../three/scenes/StoryScene'), { ssr: false })

/** Remembers, for this browser tab, that the visitor already pressed the start button. */
const SEEN_KEY = 'kais-bakery-intro-seen'

const noSubscription = () => () => {}

function readSeen() {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Keeps dark ink text readable over a bright, busy 3D scene: a glow in the page's cream, whatever the palette
 * (written out in full so Tailwind sees them).
 */
const halo =
  '[text-shadow:0_1px_1px_color-mix(in_srgb,var(--color-cream)_95%,transparent),0_0_18px_color-mix(in_srgb,var(--color-cream)_95%,transparent)]'
const haloFromSm =
  'sm:[text-shadow:0_1px_1px_color-mix(in_srgb,var(--color-cream)_95%,transparent),0_0_18px_color-mix(in_srgb,var(--color-cream)_95%,transparent)]'

/**
 * The home page: a sticky 3D stage behind a column of chapters. Scrolling sets a continuous chapter number
 * (2.5 = halfway between chapters 2 and 3) that the camera follows.
 */
export function HomeExperience() {
  const { home } = useDict()
  const story = home.story
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

  // Content first: the welcome screen lets the visitor in at once and only reports how the 3D scene is coming
  // along. `ready` is the cake on screen in its final light (or the 2D drawing standing in for it).
  const [ready, setReady] = useState(false)
  const onProgress = useCallback((value: number) => setPercent((current) => Math.max(current, value)), [])
  const onReady = useCallback(() => setReady(true), [])

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
        // A soft cream wash on the side the chapter text sits on, only while chapters are on screen.
        const on =
          Math.min(1, Math.max(0, (chapter - 0.45) * 3)) * Math.min(1, Math.max(0, (4.55 - chapter) * 3))
        shade.current.style.opacity = String(on)
      }
      if (tint.current) {
        // Inside the cake the light turns warm, like peach sponge.
        const inside = Math.max(0, 1 - Math.abs(chapter - 1.6) / 1.1)
        tint.current.style.opacity = String(Math.min(1, inside * 1.2))
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  // The side index glides with the same smooth scroll as the wheel (SmoothScroll in the root layout).
  const goTo = (index: number) => {
    const section = sections.current[index]
    if (section) scrollToElement(section, { smooth: !reduced })
  }

  const navLabel = (id: (typeof CHAPTERS)[number]) =>
    id === 'intro' ? story.introNav : id === 'build' ? story.build.nav : story.chapters[id].nav

  return (
    <div className="relative" id="story" aria-label={story.label} role="region">
      {gate !== 'closed' && (
        <IntroGate percent={percent} ready={ready} onStart={start} leaving={gate === 'leaving'} />
      )}

      <div
        className="pointer-events-none sticky top-0 h-[100svh] overflow-hidden"
        aria-hidden={gate === 'open'}
      >
        <div
          ref={tint}
          className="absolute inset-0 bg-[radial-gradient(120%_90%_at_60%_50%,var(--color-peach-soft)_0%,var(--color-cream-deep)_50%,var(--color-cream)_100%)] opacity-0"
        />
        {/*
          The cake's top sits a little below the middle of the screen and is drawn over this title, so the whole
          title has to end above it: the sticker goes first, and the words scale with the screen's height too.
        */}
        <h1
          ref={title}
          aria-label={`${home.stage.script} ${home.stage.word}, ${home.stage.subtitle}`}
          className="absolute inset-x-0 top-[max(5.5rem,9svh)] flex flex-col items-center text-center will-change-transform"
        >
          <span className="mb-1 chip rotate-[-3deg] border border-ink/80 px-3 py-1 text-sm sm:text-base">
            {home.stage.subtitle}
          </span>
          {/* A sticker shadow: the ink, or a lighter green where the set's brand colour is its ink (G3). */}
          <span className="font-script text-[clamp(4.4rem,min(15vw,19svh),12rem)] leading-[1] text-brand [text-shadow:4px_4px_0_var(--color-brand-shadow)]">
            {home.stage.script}
          </span>
          <span className="-mt-[0.15em] font-display text-[clamp(3rem,min(11vw,14svh),9rem)] leading-[0.9] font-extrabold tracking-tight text-ink uppercase">
            {home.stage.word}
          </span>
        </h1>
        <div className="absolute inset-0">
          <StoryScene chapterRef={chapterRef} started={started} onProgress={onProgress} onReady={onReady} />
        </div>
        {/*
          Came in before the scene was there: a small note where the cake is about to appear, gone once it is.
          The story's words around it are already there to read, so it is for the eyes only.
        */}
        <p
          aria-hidden
          className={`absolute top-[56%] left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-cream/85 px-4 py-2 font-display text-sm font-semibold whitespace-nowrap text-muted shadow-sm backdrop-blur transition-[opacity,translate] duration-500 ease-out ${
            gate !== 'open' && !ready ? 'opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-leaf motion-safe:animate-pulse" />
          {home.stage.baking}
          {percent > 0 && <span className="tabular-nums">· {Math.min(percent, 99)}%</span>}
        </p>
        <div
          ref={shade}
          className="absolute inset-y-0 left-0 hidden w-[62%] bg-gradient-to-r from-cream/90 via-cream/55 to-transparent opacity-0 sm:block"
        />
      </div>

      <div className="relative z-10 -mt-[100svh]">
        {CHAPTERS.map((id, index) => {
          const register = (element: HTMLElement | null) => {
            sections.current[index] = element
          }
          if (id === 'intro')
            return (
              <section
                key={id}
                ref={register}
                aria-label={story.introLabel}
                className="flex h-[100svh] flex-col items-center justify-end gap-5 px-6 pb-[5svh] text-center"
              >
                <p
                  className={`max-w-md font-display text-[clamp(1.4rem,2.6vw,2rem)] leading-tight font-bold ${halo}`}
                >
                  {story.introLine}
                  <br />
                  <span className="text-[0.8em] font-semibold text-muted">{story.introHint}</span>
                </p>
                <button
                  type="button"
                  onClick={() => goTo(1)}
                  aria-label={story.scrollDown}
                  className="btn btn-buy h-12 w-12 p-0 motion-safe:animate-nudge"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden
                  >
                    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </section>
            )
          if (id === 'build')
            return (
              <section
                key={id}
                ref={register}
                aria-labelledby="build-title"
                className="flex min-h-[115svh] flex-col items-center justify-end gap-7 px-6 pb-[9svh] text-center"
              >
                <p className="eyebrow">{story.build.eyebrow}</p>
                <h2
                  id="build-title"
                  className={`max-w-3xl font-display text-[clamp(2.4rem,6vw,5rem)] leading-[1] font-extrabold tracking-tight ${halo}`}
                >
                  {story.build.title}
                  <span className="mark">{story.build.accent}</span>
                </h2>
                <div className="flex flex-wrap justify-center gap-3">
                  <LocalLink href="/design" className="btn btn-buy px-7 py-3.5 text-lg">
                    {story.build.design}
                  </LocalLink>
                  <LocalLink href="/menu" className="btn btn-ghost px-7 py-3.5 text-lg">
                    {story.build.menu}
                  </LocalLink>
                </div>
              </section>
            )
          if (!isStoryChapter(id)) return null
          const chapter = story.chapters[id]
          return (
            <section
              key={id}
              ref={register}
              aria-labelledby={`${id}-title`}
              className="flex min-h-[135svh] items-end px-4 pb-[10svh] sm:items-center sm:px-[7vw] sm:pb-0"
            >
              <div className="max-w-xl rounded-3xl border border-line bg-cream/85 p-5 backdrop-blur-md sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                <p className="eyebrow mb-4">{chapter.eyebrow}</p>
                <h2
                  id={`${id}-title`}
                  className={`font-display text-[clamp(1.9rem,4.1vw,3.5rem)] leading-[1.08] font-extrabold tracking-tight ${haloFromSm}`}
                >
                  {chapter.lead}
                  <span className="mark">{chapter.accent}</span>
                  {chapter.tail}
                </h2>
                <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-muted">{chapter.note}</p>
              </div>
            </section>
          )
        })}
      </div>

      {/* Faded out past the story or behind the welcome screen: `inert` keeps its buttons out of the Tab order too. */}
      <nav
        aria-label={story.indexLabel}
        inert={!(inStory && gate === 'closed')}
        className={`fixed top-1/2 right-5 z-30 hidden -translate-y-1/2 transition-opacity duration-500 lg:block ${
          inStory && gate === 'closed' ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <ol className="space-y-2 rounded-2xl border border-line bg-cream/80 p-3 text-right backdrop-blur">
          {CHAPTERS.map((id, index) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => goTo(index)}
                aria-current={active === index ? 'step' : undefined}
                className={`group flex w-full items-center justify-end gap-3 rounded-lg px-1 font-display text-sm font-semibold transition-colors ${
                  active === index ? 'text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {navLabel(id)}
                <span
                  aria-hidden
                  className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${
                    active === index ? 'w-8 bg-leaf' : 'w-3 bg-edge group-hover:w-5'
                  }`}
                />
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  )
}
