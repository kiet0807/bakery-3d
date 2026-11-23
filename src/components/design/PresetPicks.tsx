'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useDict, useLang } from '@/i18n/LangProvider'
import { configKey, type CakeConfig } from '@/lib/cake'
import { money } from '@/lib/money'
import { PRESETS, presetPicture, presetPrice, type Preset } from '@/lib/presets'

/**
 * The six house cakes at the top of the builder, as a place to start: nine groups of choices are a lot to face on an
 * empty plate. Picking one over a cake of the visitor's own keeps that cake one press away.
 */
export function PresetPicks({
  config,
  matching,
  onPick,
}: {
  config: CakeConfig
  /** The house cake on the stand now, if it is one. */
  matching: Preset | undefined
  onPick: (config: CakeConfig) => void
}) {
  const { design, cake } = useDict()
  const lang = useLang()
  const t = design.picks
  const [own, setOwn] = useState<CakeConfig | null>(null)
  const pick = (preset: Preset) => {
    if (!matching) setOwn(config)
    onPick(preset.config)
  }
  const canGoBack = own !== null && configKey(own) !== configKey(config)
  return (
    <section aria-labelledby="picks-title" className="space-y-3">
      <h2 id="picks-title" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-display text-2xl font-bold">{t.title}</span>
        <span className="text-sm font-medium text-muted">{t.hint}</span>
      </h2>
      {/* One row to swipe on phones, two rows of three where there is room. */}
      <ul
        data-lenis-prevent-wheel
        className="-mx-3 flex snap-x scroll-px-3 gap-2 overflow-x-auto px-3 pt-1 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0"
      >
        {PRESETS.map((preset) => (
          <li key={preset.id} className="w-44 shrink-0 snap-start sm:w-auto">
            <button
              type="button"
              aria-pressed={matching?.id === preset.id}
              onClick={() => pick(preset)}
              className="flex h-full min-h-14 w-full items-center gap-2 rounded-2xl border-2 border-line bg-surface p-1.5 pr-2.5 text-left [transition:border-color_200ms_var(--ease-out),background-color_200ms_var(--ease-out),box-shadow_320ms_var(--ease-spring),translate_320ms_var(--ease-spring)] hover:border-edge aria-pressed:border-ink aria-pressed:bg-butter-soft aria-pressed:shadow-sticker motion-safe:aria-pressed:-translate-y-0.5"
            >
              <Image
                src={presetPicture(preset.id)}
                alt=""
                width={640}
                height={560}
                unoptimized
                className="h-12 w-14 shrink-0 rounded-xl bg-linear-to-b from-sky-top to-sky-bottom object-cover"
              />
              <span className="min-w-0">
                <span className="block font-display text-sm leading-tight font-bold">
                  {cake.presets[preset.id].name}
                </span>
                <span className="block text-xs font-semibold text-muted tabular-nums">
                  {money(presetPrice(preset), lang)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {canGoBack && (
        <button
          type="button"
          onClick={() => {
            onPick(own)
            setOwn(null)
          }}
          className="flex min-h-11 items-center gap-1.5 rounded-full text-sm font-semibold text-leaf underline-offset-4 hover:underline"
        >
          <span aria-hidden>←</span> {t.back}
        </button>
      )}
    </section>
  )
}
