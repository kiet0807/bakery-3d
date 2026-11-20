'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useDict } from '@/i18n/LangProvider'
import { PALETTES, PALETTE_IDS, type Palette, type PaletteId } from '@/lib/palettes'
import { setPalette, usePalette } from '@/lib/usePalette'

/**
 * The colour switch in the header: a round button showing the set in use, opening a small card with the four
 * sets as a radio group (WAI-ARIA radio group pattern).
 * - Arrow keys move through the sets and apply each one at once, so the page and the 3D scene preview it live;
 *   Enter, Space or a click keeps the set and closes the card. Esc closes and gives the focus back to the button,
 *   so does a click outside or tabbing away (without moving the focus).
 * - The card stays in the DOM (hidden when closed), so `aria-controls` always points at something.
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
    const index = PALETTE_IDS.indexOf(palette)
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
  return (
    <div
      ref={wrapper}
      className="sm:relative"
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
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open) close(true)
        }}
        className={`group flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-full border-2 bg-surface/70 font-display text-sm font-bold text-muted transition-colors hover:border-ink hover:text-ink lg:px-1 lg:pr-2.5 ${
          open ? 'border-ink text-ink' : 'border-ink/15'
        }`}
      >
        <span
          aria-hidden
          className="h-5 w-5 shrink-0 rounded-full border-2 border-ink bg-[conic-gradient(var(--color-brand)_0_25%,var(--color-butter)_0_50%,var(--color-buy)_0_75%,var(--color-mint)_0)] shadow-[inset_0_2px_3px_rgb(255_255_255/0.55)] transition-transform duration-300 group-hover:rotate-90 motion-reduce:transition-none"
        />
        <span aria-hidden className="hidden whitespace-nowrap lg:inline">
          {t.label}
        </span>
      </button>

      <div
        id={panelId}
        hidden={!open}
        onKeyDown={onPanelKeyDown}
        className="fixed inset-x-3 top-[4.25rem] z-50 origin-top-right rounded-[1.75rem] border-2 border-ink bg-surface p-3 shadow-sticker-lg transition-[opacity,scale,translate] duration-200 ease-out motion-reduce:transition-none sm:absolute sm:inset-x-auto sm:top-[calc(100%+0.75rem)] sm:right-0 sm:w-[21rem] starting:-translate-y-1 starting:scale-95 starting:opacity-0"
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
                className={`flex w-full items-center gap-3 rounded-2xl border-2 p-1.5 pr-3 text-left transition-[background-color,border-color,box-shadow] duration-150 ${
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
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-xs font-black ${
                    checked ? 'border-ink bg-ink text-cream' : 'border-edge text-transparent'
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
