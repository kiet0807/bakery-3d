'use client'

import dynamic from 'next/dynamic'
import { useRef, useState } from 'react'
import type { ClientDictionary } from '@/i18n/dictionaries'
import { LocalLink, useDict, useLang } from '@/i18n/LangProvider'
import { allergensOf, sizeOf, type CakeConfig } from '@/lib/cake'
import { LEAD_HOURS, leadKind } from '@/lib/leadTime'
import { money } from '@/lib/money'
import { PRESETS, presetPrice, type Preset } from '@/lib/presets'
import { useCart } from '@/lib/store'
import { ScenePoster } from '../ScenePoster'
import type { Capture } from '../three/Capture'

function VitrineLoading() {
  return <ScenePoster label={useDict().menu.loading} />
}

const VitrineScene = dynamic(() => import('../three/scenes/VitrineScene'), {
  ssr: false,
  loading: () => <VitrineLoading />,
})

const pad = (n: number) => String(n).padStart(2, '0')

function specs(config: CakeConfig, dict: ClientDictionary): { label: string; value: string }[] {
  const c = dict.cake
  const rows = [
    { label: c.kinds.sponge, value: c.sponges[config.sponge].name },
    { label: c.kinds.filling, value: c.fillings[config.filling].name },
    { label: c.kinds.frosting, value: c.frostings[config.frosting].name },
  ]
  if (config.drip !== 'none') rows.push({ label: c.kinds.drip, value: c.drips[config.drip].name })
  if (config.toppings.length)
    rows.push({ label: c.kinds.topping, value: config.toppings.map((id) => c.toppings[id].name).join(', ') })
  if (config.candles) rows.push({ label: c.kinds.candles, value: c.candles(config.candles) })
  if (config.message) rows.push({ label: c.kinds.message, value: c.quoted(config.message) })
  rows.push({
    label: dict.common.contains,
    value: allergensOf(config)
      .map((allergen) => dict.common.allergens[allergen])
      .join(', '),
  })
  return rows
}

/** "16 cm · 4–6 người" for a house cake. */
function sizeLine(preset: Preset, dict: ClientDictionary) {
  const size = sizeOf(preset.config)
  return `${dict.cake.sizes[size.id].name} · ${dict.common.units.serves(size.serves)}`
}

/**
 * The vitrine: six house cakes on a turning table in 3D, with a plain list beside it that does the same job
 * for keyboards and screen readers. Choosing a cake in either place turns the table and lifts its cloche.
 */
export function Vitrine() {
  const dict = useDict()
  const lang = useLang()
  const m = dict.menu
  const nameOf = (preset: Preset) => dict.cake.presets[preset.id].name
  const [index, setIndex] = useState(0)
  const [sliced, setSliced] = useState(false)
  const [added, setAdded] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const add = useCart((state) => state.add)
  const captureRef = useRef<Capture | null>(null)
  const swipe = useRef<{ x: number; y: number } | null>(null)

  const preset = PRESETS[index]
  const count = PRESETS.length
  const leadHours = LEAD_HOURS[leadKind(preset.config, preset.id)]

  const choose = (next: number) => {
    const wrapped = (next + count) % count
    setIndex(wrapped)
    setSliced(false)
    setStatus(m.status.chosen(nameOf(PRESETS[wrapped]), money(presetPrice(PRESETS[wrapped]), lang)))
  }

  const addToCart = () => {
    const snapshot = captureRef.current?.(256) ?? undefined
    add(preset.config, { presetId: preset.id, snapshot })
    setAdded(preset.id)
    setStatus(m.status.added(nameOf(preset)))
  }

  return (
    <div className="relative grid gap-6 xl:h-[100svh] xl:min-h-[720px] xl:grid-cols-[19rem_minmax(0,1fr)_23rem] xl:grid-rows-[auto_minmax(0,1fr)] xl:gap-x-8 xl:px-8 xl:pt-24 xl:pb-8">
      <header className="relative z-10 space-y-3 px-4 pt-20 sm:px-8 xl:col-start-1 xl:row-start-1 xl:p-0">
        <p className="eyebrow">{m.eyebrow}</p>
        <h1 className="font-display text-[clamp(2.4rem,4vw,3.2rem)] leading-[1.02] font-extrabold">
          {m.titleLead} <span className="mark">{m.titleMark}</span>
        </h1>
        <p className="max-w-sm leading-relaxed text-muted">{m.intro}</p>
      </header>

      <div
        className="sticky top-16 z-20 h-[46svh] min-h-[300px] touch-pan-y border-y-2 border-ink bg-linear-to-b from-sky-top to-sky-bottom sm:top-20 md:h-[56svh] xl:absolute xl:inset-0 xl:z-0 xl:h-auto xl:border-0 xl:bg-none"
        onPointerDown={(event) => {
          if (event.pointerType !== 'mouse') swipe.current = { x: event.clientX, y: event.clientY }
        }}
        onPointerUp={(event) => {
          const start = swipe.current
          swipe.current = null
          if (!start) return
          const dx = event.clientX - start.x
          if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(event.clientY - start.y) * 1.5)
            choose(index + (dx < 0 ? 1 : -1))
        }}
      >
        <VitrineScene
          presets={PRESETS}
          index={index}
          sliced={sliced}
          onSelect={choose}
          captureRef={captureRef}
        />
        {/* Wide screens: the cakes at the sides fade into the cream page, so the title and the card stay clear. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-cream)_94%,transparent)_0%,color-mix(in_srgb,var(--color-cream)_88%,transparent)_25%,transparent_42%,transparent_62%,color-mix(in_srgb,var(--color-cream)_55%,transparent)_76%,color-mix(in_srgb,var(--color-cream)_94%,transparent)_100%)] xl:block"
        />
        <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-3 xl:bottom-10">
          <button
            type="button"
            onClick={() => choose(index - 1)}
            aria-label={m.prev}
            className="btn btn-ghost h-12 w-12 p-0 text-xl"
          >
            <span aria-hidden>←</span>
          </button>
          <button
            type="button"
            aria-pressed={sliced}
            onClick={() => setSliced(!sliced)}
            className="btn btn-ghost h-12 px-5 text-sm"
          >
            {sliced ? m.close : m.peek}
          </button>
          <button
            type="button"
            onClick={() => choose(index + 1)}
            aria-label={m.next}
            className="btn btn-ghost h-12 w-12 p-0 text-xl"
          >
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      <fieldset className="relative z-10 px-4 sm:px-8 xl:col-start-1 xl:row-start-2 xl:self-start xl:p-0">
        <legend className="sr-only">{m.listLabel}</legend>
        <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-1">
          {PRESETS.map((item, i) => (
            <li key={item.id}>
              <label className="group block cursor-pointer">
                <input
                  type="radio"
                  name="vitrine"
                  value={item.id}
                  checked={i === index}
                  onChange={() => choose(i)}
                  className="peer sr-only"
                />
                <span className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-line bg-surface px-3 py-2.5 transition-[border-color,background-color,box-shadow] group-hover:border-edge peer-checked:border-ink peer-checked:bg-butter-soft peer-checked:shadow-sticker peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-leaf">
                  <span
                    aria-hidden
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-ink bg-surface font-display text-xs font-bold group-has-checked:bg-ink group-has-checked:text-cream"
                  >
                    {pad(i + 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block font-display text-[0.95rem] leading-tight font-bold sm:text-base">
                      {nameOf(item)}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {money(presetPrice(item), lang)}
                    </span>
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <section
        aria-labelledby="cake-name"
        className="relative z-10 px-4 sm:px-8 xl:col-start-3 xl:row-span-2 xl:row-start-1 xl:self-end xl:p-0"
      >
        <div className="sticker space-y-5 p-6">
          <div className="space-y-2">
            <p className="eyebrow">
              {m.counter(index + 1, count)} · {m.houseCake}
            </p>
            <h2 id="cake-name" className="font-display text-4xl leading-tight font-extrabold">
              {nameOf(preset)}
            </h2>
            <p className="leading-relaxed text-muted">{dict.cake.presets[preset.id].tagline}</p>
          </div>
          <p className="flex flex-wrap gap-2">
            <span className="chip rotate-[-2deg] bg-soft">{sizeLine(preset, dict)}</span>
            <span className="chip rotate-[2deg] border border-ink/70" data-testid="lead-time">
              <span aria-hidden>⏰</span> {m.lead(leadHours)}
            </span>
          </p>
          <dl className="space-y-1.5 border-t-2 border-line pt-4 text-sm">
            {specs(preset.config, dict).map((row) => (
              <div key={row.label} className="flex justify-between gap-4">
                <dt className="shrink-0 text-muted">{row.label}</dt>
                <dd className="text-right">{row.value}</dd>
              </div>
            ))}
          </dl>
          <div className="space-y-3 border-t-2 border-line pt-4">
            <p className="font-display text-3xl font-extrabold tabular-nums">
              {money(presetPrice(preset), lang)}
            </p>
            <div className="flex flex-wrap gap-2.5">
              <LocalLink
                href={`/design?preset=${preset.id}`}
                className="btn btn-ghost flex-1 px-4 text-sm whitespace-nowrap"
              >
                {m.makeItYours}
              </LocalLink>
              {added === preset.id ? (
                <LocalLink href="/cart" className="btn btn-ghost flex-1 px-4 text-sm whitespace-nowrap">
                  {m.viewCart}
                </LocalLink>
              ) : (
                <button
                  type="button"
                  onClick={addToCart}
                  className="btn btn-buy flex-1 px-4 text-sm whitespace-nowrap"
                >
                  {m.add}
                </button>
              )}
            </div>
          </div>
        </div>
        <p role="status" className="sr-only">
          {status}
        </p>
      </section>
    </div>
  )
}
