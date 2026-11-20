'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CANDLE_PRICE,
  DRIPS,
  FILLINGS,
  FROSTINGS,
  MAX_CANDLES,
  MAX_MESSAGE_LENGTH,
  MAX_TOPPINGS,
  MESSAGE_PRICE,
  SIZES,
  SPONGES,
  TOPPINGS,
  cleanMessage,
  configKey,
  priceLines,
  priceOf,
} from '@/lib/cake'
import { money } from '@/lib/money'
import { PRESETS, presetById } from '@/lib/presets'
import { useCart, useDesign } from '@/lib/store'
import { ScenePoster } from '../ScenePoster'
import type { Capture } from '../three/Capture'
import { ChoiceGroup, MultiChoiceGroup, Section } from './Choices'

const DesignScene = dynamic(() => import('../three/scenes/DesignScene'), {
  ssr: false,
  loading: () => <ScenePoster label="Preheating the oven…" />,
})

/** Opens a vitrine cake when the page is reached with ?preset=…, then tidies the address. */
function usePresetFromUrl() {
  const load = useDesign((state) => state.load)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('preset')
    const preset = presetById(id)
    if (!preset) return
    const apply = () => {
      load(preset.config)
      window.history.replaceState(null, '', window.location.pathname)
    }
    if (useDesign.persist.hasHydrated()) apply()
    else return useDesign.persist.onFinishHydration(apply)
  }, [load])
}

export function Designer() {
  usePresetFromUrl()
  const config = useDesign((state) => state.config)
  const sliced = useDesign((state) => state.sliced)
  const update = useDesign((state) => state.update)
  const toggleTopping = useDesign((state) => state.toggleTopping)
  const setSliced = useDesign((state) => state.setSliced)
  const reset = useDesign((state) => state.reset)
  const add = useCart((state) => state.add)
  const captureRef = useRef<Capture | null>(null)
  const [status, setStatus] = useState('')
  const [addedKey, setAddedKey] = useState<string | null>(null)
  const justAdded = addedKey === configKey(config)

  const price = priceOf(config)
  const lines = useMemo(() => priceLines(config), [config])
  const matchingPreset = useMemo(
    () => PRESETS.find((preset) => configKey(preset.config) === configKey(config)),
    [config],
  )

  const addToCart = () => {
    const snapshot = captureRef.current?.(256) ?? undefined
    add(config, { name: matchingPreset?.name ?? 'Your design', snapshot })
    setAddedKey(configKey(config))
    setStatus(`${matchingPreset?.name ?? 'Your cake'} was added to your cart.`)
  }

  const saveImage = () => {
    const url = captureRef.current?.(1200, 'image/png')
    if (!url) {
      setStatus('The picture could not be taken on this device.')
      return
    }
    const link = document.createElement('a')
    link.href = url
    link.download = 'crumb-and-cloud-cake.png'
    link.click()
    setStatus('Picture saved.')
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-3 pt-20 sm:px-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,1fr)] lg:gap-10 lg:pt-24">
      <div className="sticky top-16 z-10 -mx-3 h-[44svh] overflow-hidden border-b border-white/10 bg-night/70 backdrop-blur sm:mx-0 sm:rounded-[2rem] sm:border lg:top-24 lg:h-[calc(100svh-7.5rem)] lg:bg-white/[0.03]">
        <DesignScene config={config} sliced={sliced} captureRef={captureRef} />
        <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            aria-pressed={sliced}
            onClick={() => setSliced(!sliced)}
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-night shadow-soft transition-transform hover:-translate-y-0.5"
          >
            {sliced ? 'Put the slice back' : 'Slice it'}
          </button>
          <button
            type="button"
            onClick={saveImage}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold shadow-soft backdrop-blur transition-transform hover:-translate-y-0.5"
          >
            Save picture
          </button>
        </div>
      </div>

      <div className="space-y-10 pb-32 lg:pb-10">
        <header className="space-y-2">
          <p className="eyebrow">Cake builder</p>
          <h1 className="text-5xl font-light tracking-tight sm:text-6xl">Build your cake</h1>
          <p className="text-mist">
            Every choice redraws the cake in 3D. Slice it to check the layers before it goes in the box.
          </p>
        </header>

        <Section title="Size">
          <ChoiceGroup
            name="size"
            choices={SIZES}
            value={config.size}
            onChange={(size) => update({ size })}
            swatches={false}
            detail={(choice) =>
              `${SIZES.find((s) => s.id === choice.id)?.note}, serves ${SIZES.find((s) => s.id === choice.id)?.serves}`
            }
          />
        </Section>
        <Section title="Sponge">
          <ChoiceGroup
            name="sponge"
            choices={SPONGES}
            value={config.sponge}
            onChange={(sponge) => update({ sponge })}
          />
        </Section>
        <Section title="Filling">
          <ChoiceGroup
            name="filling"
            choices={FILLINGS}
            value={config.filling}
            onChange={(filling) => update({ filling })}
          />
        </Section>
        <Section title="Frosting">
          <ChoiceGroup
            name="frosting"
            choices={FROSTINGS}
            value={config.frosting}
            onChange={(frosting) => update({ frosting })}
          />
        </Section>
        <Section title="Drip">
          <ChoiceGroup
            name="drip"
            choices={DRIPS}
            value={config.drip}
            onChange={(drip) => update({ drip })}
          />
        </Section>
        <Section title="Toppings" hint={`${config.toppings.length} of ${MAX_TOPPINGS} chosen`}>
          <MultiChoiceGroup
            choices={TOPPINGS}
            values={config.toppings}
            max={MAX_TOPPINGS}
            onToggle={toggleTopping}
          />
        </Section>
        <Section title="Candles" hint={`${money(CANDLE_PRICE)} each`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => update({ candles: config.candles - 1 })}
              disabled={config.candles === 0}
              aria-label="One candle fewer"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-xl font-semibold disabled:opacity-40"
            >
              −
            </button>
            <output aria-live="polite" className="min-w-24 text-center text-3xl font-light tabular-nums">
              {config.candles} {config.candles === 1 ? 'candle' : 'candles'}
            </output>
            <button
              type="button"
              onClick={() => update({ candles: config.candles + 1 })}
              disabled={config.candles === MAX_CANDLES}
              aria-label="One candle more"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-xl font-semibold disabled:opacity-40"
            >
              +
            </button>
          </div>
        </Section>
        <Section title="Message" hint={`${money(MESSAGE_PRICE)}, on a chocolate plaque`}>
          <label className="block space-y-2">
            <span className="sr-only">Message on the cake</span>
            <input
              type="text"
              value={config.message}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder="Happy birthday, Linh"
              onChange={(event) => update({ message: cleanMessage(event.target.value) })}
              onBlur={() => update({ message: config.message.trim() })}
              className="w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-base outline-none placeholder:text-haze focus:border-moon"
            />
            <span className="block text-right text-xs text-mist tabular-nums">
              {config.message.length}/{MAX_MESSAGE_LENGTH}
            </span>
          </label>
        </Section>

        <details className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <summary className="cursor-pointer font-semibold">Price breakdown</summary>
          <dl className="mt-3 space-y-1.5 text-sm">
            {lines.map((line) => (
              <div key={line.label} className="flex justify-between gap-4">
                <dt className="text-mist">{line.label}</dt>
                <dd className="tabular-nums">{line.price ? money(line.price) : 'Included'}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t border-white/10 pt-2 font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{money(price)}</dd>
            </div>
          </dl>
        </details>

        <button
          type="button"
          onClick={reset}
          className="text-sm font-semibold text-mist underline underline-offset-4"
        >
          Start again from the house cake
        </button>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-night/85 px-4 py-3 backdrop-blur-xl lg:sticky lg:bottom-6 lg:rounded-full lg:border lg:bg-abyss/85 lg:py-2.5 lg:pr-2.5 lg:pl-6 lg:shadow-soft">
          <div className="mx-auto flex max-w-xl items-center gap-3 lg:max-w-none">
            <div className="mr-auto leading-tight">
              <p className="text-xs text-mist">{matchingPreset ? matchingPreset.name : 'Your design'}</p>
              <p className="text-3xl font-light tabular-nums" data-testid="price">
                {money(price)}
              </p>
            </div>
            {justAdded ? (
              <Link href="/cart" className="rounded-full bg-ink px-5 py-3 font-semibold text-night">
                View cart →
              </Link>
            ) : (
              <button
                type="button"
                onClick={addToCart}
                className="rounded-full bg-glow px-5 py-3 font-semibold text-night shadow-warm transition-transform hover:-translate-y-0.5"
              >
                Add to cart
              </button>
            )}
          </div>
          <p role="status" aria-live="polite" className="sr-only">
            {status}
          </p>
        </div>
      </div>
    </div>
  )
}
