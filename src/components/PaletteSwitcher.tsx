'use client'

import { usePathname } from 'next/navigation'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react'
import { useOnce } from '@/hooks/useOnce'
import { useDict } from '@/i18n/LangProvider'
import { PALETTES, PALETTE_IDS, type Palette, type PaletteId } from '@/lib/palettes'
import { readPalette, setPalette, usePalette } from '@/lib/usePalette'

/**
 * The colour switch in the header: a round button showing the set in use, opening a small card with the four
 * sets as a radio group (WAI-ARIA radio group pattern).
 * - Arrow keys move through the sets and apply each one at once, so the page and the 3D scene preview it live;
 *   Enter, Space or a click keeps the set and closes the card. Esc closes and gives the focus back to the button,
 *   so does a click outside or tabbing away (without moving the focus).
 * - The card stays in the DOM (invisible when closed), so `aria-controls` always points at something.
 * - The browser's toolbar colour (`<meta name="theme-color">`) follows the set; the root layout ships the
 *   default set's cream, and client navigations can re-render the tag, hence the pathname in the effect.
 */
export function PaletteSwitcher() {
  const { common } = useDict()
  const t = common.palette
  const palette = usePalette()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const radios = useRef<Partial<Record<PaletteId, HTMLButtonElement | null>>>({})
  const id = useId()
  const panelId = `${id}panel`
  const titleId = `${id}title`
  const hintId = `${id}hint`

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', PALETTES[palette].cream)
  }, [palette, pathname])

  // Opening puts the focus on the set in use, as a radio group does.
  useEffect(() => {
    if (open) radios.current[palette]?.focus()
    // Only on opening: arrow keys move the focus themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // A press anywhere outside closes the card without taking the focus away from where it lands.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const close = (refocus: boolean) => {
    setOpen(false)
    if (refocus) button.current?.focus()
  }

  const onPanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      close(true)
      return
    }
    // From the page, not from React state: a set chosen inside a cross-fade that has not rendered yet still counts.
    const index = PALETTE_IDS.indexOf(readPalette())
    const last = PALETTE_IDS.length - 1
    const target =
      event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? index === 0
            ? last
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : -1
    if (target < 0) return
    event.preventDefault()
    const next = PALETTE_IDS[target]
    setPalette(next)
    radios.current[next]?.focus()
  }

  const name = t.sets[palette].name
  const [nudged, setNudged] = useState(false)
  return (
    <div
      ref={wrapper}
      className="relative"
      onBlur={(event) => {
        // Tabbing out of the switch closes it; moving between the button and the card does not.
        if (open && !wrapper.current?.contains(event.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <button
        ref={button}
        type="button"
        aria-label={t.current(name)}
        aria-expanded={open}
        aria-controls={panelId}
        title={t.label}
        onClick={() => {
          setNudged(true)
          setOpen((value) => !value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open) close(true)
        }}
        className={`group tap relative flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-full border-2 bg-surface/70 font-display text-sm font-bold text-muted transition-colors hover:border-ink hover:text-ink lg:px-1 lg:pr-2.5 ${
          open ? 'border-ink text-ink' : 'border-ink/15'
        }`}
      >
        <span
          aria-hidden
          className={`h-5 w-5 shrink-0 rounded-full border-2 border-ink bg-[conic-gradient(var(--color-brand)_0_25%,var(--color-butter)_0_50%,var(--color-buy)_0_75%,var(--color-mint)_0)] shadow-[inset_0_2px_3px_rgb(255_255_255/0.55)] transition-transform duration-500 ease-spring group-hover:rotate-90 ${
            open ? 'rotate-90' : ''
          }`}
        />
        <span aria-hidden className="hidden whitespace-nowrap lg:inline">
          {t.label}
        </span>
      </button>

      <Nudge
        anchor={wrapper}
        text={t.nudge}
        off={open || nudged}
        onTap={() => {
          setNudged(true)
          setOpen(true)
        }}
      />

      {/*
        Closed, the card is `invisible` rather than `hidden`, so it can leave as smoothly as it came: it grows out of
        the button (260 ms, soft landing) and shrinks back into it faster (150 ms). Invisible also takes it out of the
        Tab order and the accessibility tree, as `hidden` did. Visibility is left out of the opening transition: it
        must turn visible at once, or the focus that opening puts on the checked set lands on an invisible element
        and is dropped. Closing keeps it, so the card stays visible until it has faded.
      */}
      <div
        id={panelId}
        onKeyDown={onPanelKeyDown}
        className={`fixed inset-x-3 top-[4.25rem] z-50 origin-top rounded-[1.75rem] border-2 border-ink bg-surface p-3 shadow-sticker-lg sm:absolute sm:inset-x-auto sm:top-[calc(100%+0.75rem)] sm:right-0 sm:w-[21rem] sm:origin-top-right ${
          open
            ? 'visible transition-[opacity,scale,translate] duration-[260ms] ease-out'
            : 'pointer-events-none invisible -translate-y-1.5 scale-95 opacity-0 transition-[opacity,scale,translate,visibility] duration-150 ease-in'
        }`}
      >
        <div className="flex items-start gap-2 px-1.5 pt-0.5 pb-2.5">
          <span aria-hidden className="mt-0.5 text-lg leading-none">
            🎨
          </span>
          <div className="min-w-0">
            <p id={titleId} className="font-display text-lg leading-tight font-extrabold text-ink">
              {t.label}
            </p>
            <p id={hintId} className="text-sm leading-snug text-pretty text-muted">
              {t.hint}
            </p>
          </div>
        </div>
        <div role="radiogroup" aria-labelledby={titleId} aria-describedby={hintId} className="grid gap-1.5">
          {PALETTE_IDS.map((option) => {
            const checked = option === palette
            const words = t.sets[option]
            return (
              <button
                key={option}
                ref={(element) => {
                  radios.current[option] = element
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-labelledby={`${id}${option}name`}
                aria-describedby={`${id}${option}note`}
                tabIndex={checked ? 0 : -1}
                data-palette-option={option}
                onClick={() => {
                  setPalette(option)
                  close(true)
                }}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 p-1.5 pr-3 text-left transition-[background-color,border-color,box-shadow] duration-200 ${
                  checked
                    ? 'border-ink bg-soft shadow-sticker'
                    : 'border-transparent hover:border-line hover:bg-butter-soft'
                }`}
              >
                <Swatch palette={PALETTES[option]} />
                <span className="min-w-0 flex-1">
                  <span
                    id={`${id}${option}name`}
                    className="block font-display text-base leading-tight font-bold text-ink"
                  >
                    {words.name}
                  </span>
                  <span
                    id={`${id}${option}note`}
                    className="block text-[0.8rem] leading-snug text-pretty text-muted"
                  >
                    {words.note}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-xs font-black transition-[background-color,border-color,color,scale] duration-300 ease-spring ${
                    checked
                      ? 'scale-100 border-ink bg-ink text-cream'
                      : 'scale-90 border-edge text-transparent'
                  }`}
                >
                  ✓
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** A beat after the page (or the welcome screen's exit) settles, so the bubble does not land with everything else. */
const NUDGE_AFTER_MS = 2000
/** Long enough to read; a tap on it or on the switch ends it sooner. */
const NUDGE_FOR_MS = 8000
/** The bubble keeps at least this far from the screen's edges, in pixels. */
const EDGE = 12
/** Below this width the switch is a bare colour dot (its words show from `lg`). */
const DOT_ONLY = '(max-width: 1023.98px)'
/** Room the bubble takes under the dot (two lines of text and the tail), and its widest, in pixels. */
const BUBBLE_HEIGHT = 76
const BUBBLE_WIDTH = 240

/** How far the page may move under the bubble before it bows out, in pixels: it belongs to the view it opened on. */
const NUDGE_SCROLL = 80

/**
 * True while something that has to stay readable sits where the bubble would appear: the page's main title, or
 * anything marked `data-keep-clear` (the note on the builder's stage). The bubble waits rather than cover it. On a
 * phone the home page's big title sits right under the header until the story fades it out; other pages' titles
 * sit lower and do not wait.
 */
function wouldCover(anchor: HTMLElement) {
  const dot = anchor.getBoundingClientRect()
  const room = document.documentElement.clientWidth
  const width = Math.min(BUBBLE_WIDTH, room - 2 * EDGE)
  const left = Math.min(Math.max(dot.left + dot.width / 2 - width / 2, EDGE), room - EDGE - width)
  const top = dot.bottom
  return Array.from(document.querySelectorAll('main h1, main [data-keep-clear]')).some((element) => {
    if (!element.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false
    const box = element.getBoundingClientRect()
    return box.left < left + width && box.right > left && box.top < top + BUBBLE_HEIGHT && box.bottom > top
  })
}

/**
 * Once per browser, on screens where the switch is only a colour dot: a speech bubble under it saying what it
 * does. It waits while the page is inert (the home page's welcome screen is a modal and makes the header inert)
 * or while it would sit on something to read (`wouldCover`), and appears a moment after. Scrolling on sends it
 * away. A tap on it opens the switch. It is hidden from screen readers, which hear the
 * switch's own name, and it is not focusable: the switch itself is the control.
 */
function Nudge({
  anchor,
  text,
  off,
  onTap,
}: {
  anchor: RefObject<HTMLElement | null>
  text: string
  /** The switch is open or has been used: the bubble has done its job. */
  off: boolean
  onTap: () => void
}) {
  const { due, start, done } = useOnce('palette')
  const [phase, setPhase] = useState<'waiting' | 'in' | 'out' | 'gone'>('waiting')

  // Waits for a screen where the switch has no words, for the page to be usable (not inert) and for the title to
  // be out of the way, then a beat; still clear after the beat, it shows.
  useEffect(() => {
    if (!due || phase !== 'waiting' || off) return
    const element = anchor.current
    if (!element || !window.matchMedia(DOT_ONLY).matches) return
    const clear = () => !element.closest('[inert]') && !wouldCover(element)
    let timer = 0
    let frame = 0
    const check = () => {
      frame = 0
      if (!clear()) {
        window.clearTimeout(timer)
        timer = 0
      } else if (!timer)
        timer = window.setTimeout(() => {
          timer = 0
          if (clear() && start()) setPhase('in')
        }, NUDGE_AFTER_MS)
    }
    // The frame after the next: the page answers a scroll in the next one (the home page fades its title then).
    const schedule = () =>
      (frame ||= requestAnimationFrame(() => {
        frame = requestAnimationFrame(check)
      }))
    const observer = new MutationObserver(schedule)
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['inert'] })
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    check()
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
  }, [due, phase, off, anchor, start])

  useEffect(() => {
    if (phase !== 'in') return
    if (off) {
      const now = window.setTimeout(() => setPhase('out'), 0)
      return () => window.clearTimeout(now)
    }
    const timer = window.setTimeout(() => setPhase('out'), NUDGE_FOR_MS)
    const from = window.scrollY
    const onScroll = () => {
      if (Math.abs(window.scrollY - from) > NUDGE_SCROLL) setPhase('out')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [phase, off])

  useEffect(() => {
    if (phase !== 'out') return
    const timer = window.setTimeout(() => setPhase('gone'), 220)
    return () => window.clearTimeout(timer)
  }, [phase])

  // Remembered once it has been on screen: when it leaves, or when the page goes away while it is up. Someone who
  // found the switch on their own never needs it either.
  const shown = phase !== 'waiting'
  useEffect(() => {
    if (phase === 'gone' || off) done()
  }, [phase, off, done])
  useEffect(() => () => void (shown && done()), [shown, done])

  // Centred under the dot, then slid back inside the screen if it would cross an edge (the dot sits near the
  // right edge on phones); the tail stays on the dot. Measured without the pop-in's scale (offsetWidth).
  const bubble = useRef<HTMLDivElement>(null)
  const tail = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const box = bubble.current
    const element = anchor.current
    if (phase !== 'in' || !box || !element) return
    const rect = element.getBoundingClientRect()
    const width = box.offsetWidth
    const left = rect.left + rect.width / 2 - width / 2
    const room = document.documentElement.clientWidth
    let shift = 0
    if (left < EDGE) shift = EDGE - left
    else if (left + width > room - EDGE) shift = room - EDGE - (left + width)
    box.style.marginLeft = `${shift}px`
    box.style.transformOrigin = `calc(50% - ${shift}px) 0`
    if (tail.current) tail.current.style.left = `calc(50% - ${shift}px)`
  }, [phase, anchor])

  if (phase === 'waiting' || phase === 'gone') return null
  return (
    // Under the dot, its tail pointing up at it. Fades out on its own element, so the pop-in never fights it.
    <div
      aria-hidden
      data-hint="palette"
      className={`absolute top-[calc(100%+0.7rem)] left-1/2 z-10 transition-[opacity,translate] duration-200 ease-in ${
        phase === 'out' ? '-translate-y-1 opacity-0' : ''
      }`}
    >
      <div
        ref={bubble}
        onClick={onTap}
        className="relative w-max max-w-[min(15rem,calc(100vw-2rem))] -translate-x-1/2 animate-pop cursor-pointer rounded-2xl border-2 border-ink bg-butter px-3 py-2 text-center font-display text-sm leading-snug font-bold text-ink shadow-sticker"
      >
        <span
          ref={tail}
          className="absolute -top-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-t-2 border-l-2 border-ink bg-butter"
        />
        {text}
      </div>
    </div>
  )
}

/**
 * A tiny shop front in the set's own colours, whatever set is in use: cream page, a mint and a peach blob, the
 * "K" of Kai's in the brand colour and a buy pill. The colours come from `PALETTES`, so they cannot drift.
 */
function Swatch({ palette }: { palette: Palette }) {
  return (
    <span
      aria-hidden
      className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[0.9rem] border-2"
      style={{ background: palette.cream, borderColor: palette.ink }}
    >
      <span
        className="absolute -top-2.5 -right-2.5 h-8 w-8 rounded-full"
        style={{ background: palette.mint }}
      />
      <span
        className="absolute -bottom-3 -left-3 h-7 w-9 rounded-full opacity-80"
        style={{ background: palette.peach }}
      />
      <span
        className="absolute top-0 left-1.5 font-script text-[1.45rem] leading-[1.45]"
        style={{ color: palette.brand }}
      >
        K
      </span>
      <span
        className="absolute right-1 bottom-1 h-2.5 w-5 rounded-full"
        style={{ background: palette.buy, boxShadow: `1px 1px 0 ${palette.ink}` }}
      />
      <span className="absolute inset-0 bg-[linear-gradient(140deg,rgb(255_255_255/0.55),transparent_45%)]" />
    </span>
  )
}
