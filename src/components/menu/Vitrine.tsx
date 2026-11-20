'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { dripOf, fillingOf, frostingOf, sizeOf, spongeOf, toppingOf, type CakeConfig } from '@/lib/cake'
import { money } from '@/lib/money'
import { PRESETS, presetPrice } from '@/lib/presets'
import { useCart } from '@/lib/store'
import { ScenePoster } from '../ScenePoster'
import type { Capture } from '../three/Capture'

const VitrineScene = dynamic(() => import('../three/scenes/VitrineScene'), {
  ssr: false,
  loading: () => <ScenePoster label="Polishing the glass…" />,
})

const pad = (n: number) => String(n).padStart(2, '0')

function specs(config: CakeConfig): { label: string; value: string }[] {
  const size = sizeOf(config)
  const rows = [
    { label: 'Size', value: `${size.name}, serves ${size.serves}` },
    { label: 'Sponge', value: spongeOf(config).name },
    { label: 'Filling', value: fillingOf(config).name },
    { label: 'Frosting', value: frostingOf(config).name },
  ]
  if (config.drip !== 'none') rows.push({ label: 'Drip', value: dripOf(config).name })
  if (config.toppings.length)
    rows.push({ label: 'Toppings', value: config.toppings.map((id) => toppingOf(id).name).join(', ') })
  if (config.candles) rows.push({ label: 'Candles', value: String(config.candles) })
  if (config.message) rows.push({ label: 'Message', value: `“${config.message}”` })
  return rows
}

/**
 * The vitrine: six house cakes on a turning table in 3D, with a plain list beside it that does the same job
 * for keyboards and screen readers. Choosing a cake in either place turns the table and lifts its cloche.
 */
export function Vitrine() {
  const [index, setIndex] = useState(0)
  const [sliced, setSliced] = useState(false)
  const [added, setAdded] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const add = useCart((state) => state.add)
  const captureRef = useRef<Capture | null>(null)
  const swipe = useRef<{ x: number; y: number } | null>(null)

  const preset = PRESETS[index]
  const count = PRESETS.length

  const choose = (next: number) => {
    const wrapped = (next + count) % count
    setIndex(wrapped)
    setSliced(false)
    setStatus(`${PRESETS[wrapped].name}, ${money(presetPrice(PRESETS[wrapped]))}.`)
  }

  const addToCart = () => {
    const snapshot = captureRef.current?.(256) ?? undefined
    add(preset.config, { name: preset.name, snapshot })
    setAdded(preset.id)
    setStatus(`${preset.name} was added to your cart.`)
  }

  return (
    <div className="relative grid gap-6 xl:h-[100svh] xl:min-h-[720px] xl:grid-cols-[19rem_minmax(0,1fr)_23rem] xl:grid-rows-[auto_minmax(0,1fr)] xl:gap-x-8 xl:px-8 xl:pt-24 xl:pb-8">
      <header className="relative z-10 space-y-3 px-4 pt-20 sm:px-8 xl:col-start-1 xl:row-start-1 xl:p-0">
        <p className="eyebrow">The vitrine</p>
        <h1 className="text-[clamp(2.6rem,4vw,3.4rem)] leading-[0.98] font-light tracking-tight">
          Six house cakes, <span className="text-accent">under glass.</span>
        </h1>
        <p className="max-w-sm text-mist">
          Pick one to bring it to the front. Peek inside, take it as it is, or open it in the builder and make
          it yours.
        </p>
      </header>

      <div
        className="sticky top-16 z-20 h-[46svh] min-h-[300px] touch-pan-y border-y border-white/10 bg-night/80 backdrop-blur sm:top-20 md:h-[56svh] xl:absolute xl:inset-0 xl:z-0 xl:h-auto xl:border-0 xl:bg-transparent xl:backdrop-blur-none"
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
        {/* Wide screens: the cakes at the sides fade behind the title and the card, so the text stays clear. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,rgb(6_8_20/0.88)_0%,rgb(6_8_20/0.45)_24%,transparent_40%,transparent_62%,rgb(6_8_20/0.45)_76%,rgb(6_8_20/0.85)_100%)] xl:block"
        />
        <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-3 xl:bottom-10">
          <button
            type="button"
            onClick={() => choose(index - 1)}
            aria-label="Previous cake"
            className="glass grid h-12 w-12 place-items-center rounded-full text-xl transition-colors hover:border-moon hover:text-moon"
          >
            <span aria-hidden>←</span>
          </button>
          <button
            type="button"
            aria-pressed={sliced}
            onClick={() => setSliced(!sliced)}
            className="h-12 rounded-full bg-ink px-5 text-sm font-semibold text-night shadow-soft transition-transform hover:-translate-y-0.5"
          >
            {sliced ? 'Close it up' : 'Peek inside'}
          </button>
          <button
            type="button"
            onClick={() => choose(index + 1)}
            aria-label="Next cake"
            className="glass grid h-12 w-12 place-items-center rounded-full text-xl transition-colors hover:border-moon hover:text-moon"
          >
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      <fieldset className="relative z-10 px-4 sm:px-8 xl:col-start-1 xl:row-start-2 xl:self-start xl:p-0">
        <legend className="sr-only">Choose a cake</legend>
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-1">
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
                <span className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-abyss/75 px-3.5 py-2.5 backdrop-blur transition-colors group-hover:border-white/25 peer-checked:border-moon peer-checked:bg-deep/70 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-moon">
                  <span className="font-display text-xs tracking-[0.2em] text-moon">{pad(i + 1)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium sm:text-base">
                    {item.name}
                  </span>
                  <span className="hidden text-sm text-mist tabular-nums sm:inline">
                    {money(presetPrice(item))}
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
        <div className="space-y-5 rounded-3xl border border-white/10 bg-abyss/80 p-6 shadow-soft backdrop-blur-xl">
          <div className="space-y-2">
            <p className="eyebrow">
              {pad(index + 1)} / {pad(count)} · House cake
            </p>
            <h2 id="cake-name" className="text-4xl leading-tight font-light">
              {preset.name}
            </h2>
            <p className="leading-relaxed text-mist">{preset.tagline}</p>
          </div>
          <dl className="space-y-1.5 border-t border-white/10 pt-4 text-sm">
            {specs(preset.config).map((row) => (
              <div key={row.label} className="flex justify-between gap-4">
                <dt className="text-haze">{row.label}</dt>
                <dd className="text-right">{row.value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
            <p className="mr-auto text-3xl font-light tabular-nums">{money(presetPrice(preset))}</p>
            <Link
              href={`/design?preset=${preset.id}`}
              className="rounded-full border border-white/30 px-4 py-3 text-sm font-medium transition-colors hover:border-moon hover:text-moon"
            >
              Make it yours
            </Link>
            {added === preset.id ? (
              <Link href="/cart" className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-night">
                View cart →
              </Link>
            ) : (
              <button
                type="button"
                onClick={addToCart}
                className="rounded-full bg-glow px-5 py-3 text-sm font-semibold text-night shadow-warm transition-transform hover:-translate-y-0.5"
              >
                Add to cart
              </button>
            )}
          </div>
        </div>
        <p role="status" className="sr-only">
          {status}
        </p>
      </section>
    </div>
  )
}
