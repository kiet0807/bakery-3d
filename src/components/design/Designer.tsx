'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { allergenText, lineLabel } from '@/i18n/cake-text'
import { localeHref } from '@/i18n/config'
import { LocalLink, useDict, useLang } from '@/i18n/LangProvider'
import {
  DRIPS,
  FILLINGS,
  FROSTINGS,
  MAX_CANDLES,
  MAX_MESSAGE_LENGTH,
  MAX_TOPPINGS,
  SIZES,
  SPONGES,
  SWEETNESS,
  TOPPINGS,
  cleanMessage,
  configKey,
  priceLines,
  priceOf,
  surcharge,
  type BandPrice,
  type SizeId,
  type Sweetness,
} from '@/lib/cake'
import { LEAD_HOURS, leadKind } from '@/lib/leadTime'
import { money } from '@/lib/money'
import { PRESETS, presetById } from '@/lib/presets'
import { EDIT_PARAM, SHARE_PARAM, decodeCake, designPath } from '@/lib/share'
import { useCart, useDesign } from '@/lib/store'
import { ScenePoster } from '../ScenePoster'
import { TickingMoney } from '../TickingMoney'
import type { Capture } from '../three/Capture'
import { ChoiceGroup, MultiChoiceGroup, Section, type ChoiceView } from './Choices'
import { DragHint } from './DragHint'
import { SectionNav } from './SectionNav'

function DesignLoading() {
  return <ScenePoster label={useDict().design.loading} />
}

const DesignScene = dynamic(() => import('../three/scenes/DesignScene'), {
  ssr: false,
  loading: () => <DesignLoading />,
})

/**
 * Opens a design from the address, then tidies it: `#cake=…` is a design someone shared (`?cake=…` in links made
 * before 2026-11-20), `?preset=…` a vitrine cake. A shared design wins if both are there; a broken token is simply
 * dropped. A shared link opened while the builder is already open only changes the fragment, with no new page
 * load, hence the `hashchange` listener. `?edit=<line>` comes with a design from the cart: the builder then changes
 * that line instead of adding a new one, until the visitor leaves the page.
 */
function useDesignFromUrl(onEdit: (id: string | null) => void) {
  const load = useDesign((state) => state.load)
  useEffect(() => {
    let stopWaiting = () => {}
    const read = () => {
      const params = new URLSearchParams(window.location.search)
      const token =
        new URLSearchParams(window.location.hash.slice(1)).get(SHARE_PARAM) ?? params.get(SHARE_PARAM)
      if (!token && !params.has('preset')) return
      const config = decodeCake(token) ?? presetById(params.get('preset'))?.config
      const apply = () => {
        if (config) load(config)
        onEdit(config ? params.get(EDIT_PARAM) : null)
        window.history.replaceState(null, '', window.location.pathname)
      }
      if (useDesign.persist.hasHydrated()) apply()
      else stopWaiting = useDesign.persist.onFinishHydration(apply)
    }
    read()
    window.addEventListener('hashchange', read)
    return () => {
      window.removeEventListener('hashchange', read)
      stopWaiting()
    }
  }, [load, onEdit])
}

/** The groups of choices, in page order: names in the dictionary's `cake.kinds`, anchors `choose-<kind>`. */
const SECTIONS = [
  'size',
  'sponge',
  'filling',
  'frosting',
  'drip',
  'topping',
  'sweetness',
  'candles',
  'message',
] as const

/** Buttons that sit on the 3D stage. */
const STAGE_BUTTON = 'btn btn-ghost px-4 py-2 text-sm'

export function Designer() {
  const [editing, setEditing] = useState<string | null>(null)
  useDesignFromUrl(setEditing)
  const dict = useDict()
  const lang = useLang()
  const d = dict.design
  const c = dict.cake
  const config = useDesign((state) => state.config)
  const sliced = useDesign((state) => state.sliced)
  const update = useDesign((state) => state.update)
  const toggleTopping = useDesign((state) => state.toggleTopping)
  const setSliced = useDesign((state) => state.setSliced)
  const reset = useDesign((state) => state.reset)
  const add = useCart((state) => state.add)
  const replace = useCart((state) => state.replace)
  // A line edited here that is still in the cart (it may have been removed in another tab).
  const line = useCart((state) =>
    editing && state.items.some((item) => item.id === editing) ? editing : null,
  )
  const captureRef = useRef<Capture | null>(null)
  const shareField = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState('')
  const [addedKey, setAddedKey] = useState<string | null>(null)
  const key = configKey(config)
  const justAdded = addedKey === key
  // A share message, or a link to copy by hand, belongs to the design it was made for.
  const [shared, setShared] = useState<{ key: string; url?: string } | null>(null)
  const share = shared?.key === key ? shared : null
  // Photo mode belongs to the scene it started on: any change to the cake ends it.
  const sceneKey = `${key}|${sliced}`
  const [photoFor, setPhotoFor] = useState<string | null>(null)
  const [photoProgress, setPhotoProgress] = useState(0)
  const [photoNote, setPhotoNote] = useState('')
  // The stage shows the 2D drawing (no WebGL, or the scene crashed): no studio photo then. Stable for CanvasShell.
  const [flat, setFlat] = useState(false)
  const showFlat = useCallback(() => setFlat(true), [])
  const stage = useRef<HTMLDivElement>(null)
  const [sceneReady, setSceneReady] = useState(false)
  const markReady = useCallback(() => setSceneReady(true), [])
  if (photoFor !== null && photoFor !== sceneKey) setPhotoFor(null)
  const photo = photoFor === sceneKey && !flat
  const developed = photo && photoProgress >= 1

  const price = priceOf(config)
  const lines = useMemo(() => priceLines(config), [config])
  const matchingPreset = useMemo(
    () => PRESETS.find((preset) => configKey(preset.config) === configKey(config)),
    [config],
  )
  const presetName = matchingPreset ? c.presets[matchingPreset.id].name : c.yourDesign
  const lead = leadKind(config, matchingPreset?.id)

  useEffect(() => {
    if (share?.url) shareField.current?.select()
  }, [share?.url])

  const view = <Id extends string>(
    list: { id: Id; price: BandPrice; color: string }[],
    words: Record<Id, { name: string; note: string }>,
  ): ChoiceView<Id>[] =>
    list.map((choice) => ({ ...choice, ...words[choice.id], price: surcharge(choice, config.size) }))
  const sizes: ChoiceView<SizeId>[] = SIZES.map((size) => ({
    id: size.id,
    color: size.color,
    price: size.price,
    ...c.sizes[size.id],
  }))
  const sweetness: ChoiceView<Sweetness>[] = SWEETNESS.map((id) => ({
    id,
    color: '',
    price: 0,
    ...c.sweetness[id],
  }))

  const addToCart = () => {
    const snapshot = captureRef.current?.(256) ?? undefined
    const options = { presetId: matchingPreset?.id, snapshot }
    if (line) replace(line, config, options)
    else add(config, options)
    setAddedKey(key)
    setStatus(line ? d.status.updated(presetName) : d.status.added(presetName))
  }

  const shareDesign = () => {
    const url = window.location.origin + localeHref(lang, designPath(config))
    const copied = () => {
      setShared({ key })
      setStatus(d.summary.copied)
    }
    const manual = () => {
      setShared({ key, url })
      setStatus(d.summary.manual)
    }
    try {
      // Called inside the click, as browsers require. Locked-down browsers refuse: then the link is shown.
      navigator.clipboard.writeText(url).then(copied, manual)
    } catch {
      manual()
    }
  }

  const saveImage = () => {
    const url = captureRef.current?.(1200, 'image/png')
    if (!url) {
      setPhotoNote(d.status.pictureFailed)
      setStatus(d.status.pictureFailed)
      return
    }
    const link = document.createElement('a')
    link.href = url
    link.download = photo ? d.files.studio : d.files.picture
    link.click()
    setStatus(photo ? d.status.studioSaved : d.status.pictureSaved)
  }

  const startPhoto = () => {
    setPhotoProgress(0)
    setPhotoNote('')
    setPhotoFor(sceneKey)
    setStatus(d.status.studioStart)
  }

  const photoFailed = (error: unknown) => {
    console.warn('Path tracing failed, back to the live view.', error)
    setPhotoFor(null)
    setPhotoNote(d.status.studioUnavailable)
    setStatus(d.status.studioUnavailable)
  }

  return (
    // `--stage`: the stage's height below `lg`, shared with the bar that sticks under it. It shrinks while the words
    // on the cake are typed, when a phone's keyboard takes the lower half of the screen. It grows back a moment after
    // the field loses the focus, not at once: the tap that took the focus would otherwise land on what moved there.
    <div className="group/builder mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-6 px-3 pt-20 [--stage:max(38svh,13rem)] max-lg:has-[[data-typing]:focus]:[--stage:max(24svh,9rem)] sm:px-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,1fr)] lg:gap-10 lg:pt-24">
      {/* The wheel zooms the cake here (OrbitControls), so the smooth page scroll keeps out of the stage. */}
      <div
        ref={stage}
        data-lenis-prevent-wheel
        className="sticky top-16 z-10 -mx-3 h-(--stage) overflow-hidden transition-[height] delay-300 duration-0 max-lg:group-has-[[data-typing]:focus]/builder:delay-0 sm:top-20 border-b-2 border-ink bg-linear-to-b from-sky-top to-sky-bottom sm:mx-0 sm:rounded-[2rem] sm:border-2 sm:shadow-sticker-lg lg:top-24 lg:h-[calc(100svh-7.5rem)]"
      >
        <DesignScene
          config={config}
          sliced={sliced}
          captureRef={captureRef}
          photo={photo}
          onPhotoProgress={setPhotoProgress}
          onPhotoError={photoFailed}
          onFallback={showFlat}
          onReady={markReady}
        />
        <span
          data-keep-clear
          className="chip pointer-events-none absolute top-3 left-3 rotate-[-3deg] border border-ink/70 transition-opacity max-lg:group-has-[[data-typing]:focus]/builder:opacity-0"
        >
          <span aria-hidden>✦</span> {dict.common.illustration}
        </span>
        {!photo && !flat && <DragHint ready={sceneReady} stageRef={stage} />}
        <div className="absolute inset-x-3 bottom-3 flex flex-col items-center gap-2">
          {photoNote && !photo && (
            <p className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-ink shadow-soft">
              {photoNote}
            </p>
          )}
          {photo && !developed ? (
            <div className="sticker flex w-full max-w-sm items-center gap-3 rounded-full py-2 pr-2 pl-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted">{d.stage.developing}</p>
                <div
                  role="progressbar"
                  aria-label={d.stage.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(photoProgress * 100)}
                  className="mt-1.5 h-2 overflow-hidden rounded-full bg-soft"
                >
                  <div
                    className="h-full rounded-full bg-leaf transition-[width] duration-300"
                    style={{ width: `${Math.round(photoProgress * 100)}%` }}
                  />
                </div>
              </div>
              <button type="button" onClick={() => setPhotoFor(null)} className={STAGE_BUTTON}>
                {d.stage.cancel}
              </button>
            </div>
          ) : developed ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button type="button" onClick={saveImage} className="btn btn-buy px-4 py-2 text-sm">
                {d.stage.download}
              </button>
              <button type="button" onClick={() => setPhotoFor(null)} className={STAGE_BUTTON}>
                {d.stage.back}
              </button>
            </div>
          ) : (
            // The 2D drawing can be neither cut nor photographed.
            <div className={`flex-wrap items-center justify-center gap-2 ${flat ? 'hidden' : 'flex'}`}>
              <button
                type="button"
                aria-pressed={sliced}
                onClick={() => setSliced(!sliced)}
                className={STAGE_BUTTON}
              >
                {sliced ? d.stage.unslice : d.stage.slice}
              </button>
              <button type="button" onClick={saveImage} className={STAGE_BUTTON}>
                {d.stage.save}
              </button>
              {/* Path tracing is a desktop-GPU job; phones keep the instant picture. */}
              <button type="button" onClick={startPhoto} className={`${STAGE_BUTTON} hidden md:inline-flex`}>
                {d.stage.studio}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-10 lg:pb-10">
        <header className="space-y-3">
          <p className="eyebrow">{d.eyebrow}</p>
          <h1 className="font-display text-[2.5rem] leading-[1.02] font-extrabold sm:text-6xl">
            {d.titleLead} <span className="mark">{d.titleMark}</span>
          </h1>
          <p className="max-w-prose text-lg leading-relaxed text-muted">{d.intro}</p>
        </header>

        <SectionNav
          stageRef={stage}
          sections={SECTIONS.map((kind) => ({ id: `choose-${kind}`, title: c.kinds[kind] }))}
        />

        <Section id="choose-size" title={c.kinds.size} hint={d.hints.size}>
          <ChoiceGroup
            name="size"
            choices={sizes}
            value={config.size}
            onChange={(size) => update({ size })}
            swatches={false}
            detail={(choice) => {
              const size = SIZES.find((s) => s.id === choice.id)
              return size ? `${dict.common.units.serves(size.serves)} · ${choice.note}` : choice.note
            }}
            priceText={(choice) => money(choice.price, lang)}
          />
        </Section>
        <Section id="choose-sponge" title={c.kinds.sponge}>
          <ChoiceGroup
            name="sponge"
            choices={view(SPONGES, c.sponges)}
            value={config.sponge}
            onChange={(sponge) => update({ sponge })}
          />
        </Section>
        <Section id="choose-filling" title={c.kinds.filling}>
          <ChoiceGroup
            name="filling"
            choices={view(FILLINGS, c.fillings)}
            value={config.filling}
            onChange={(filling) => update({ filling })}
          />
        </Section>
        <Section id="choose-frosting" title={c.kinds.frosting} hint={d.hints.frosting}>
          <ChoiceGroup
            name="frosting"
            choices={view(FROSTINGS, c.frostings)}
            value={config.frosting}
            onChange={(frosting) => update({ frosting })}
          />
        </Section>
        <Section id="choose-drip" title={c.kinds.drip}>
          <ChoiceGroup
            name="drip"
            choices={view(DRIPS, c.drips)}
            value={config.drip}
            onChange={(drip) => update({ drip })}
          />
        </Section>
        <Section
          id="choose-topping"
          title={c.kinds.topping}
          hint={
            <span className="chip rotate-[2deg] text-sm">
              {d.hints.toppings(config.toppings.length, MAX_TOPPINGS)}
            </span>
          }
        >
          <MultiChoiceGroup
            choices={view(TOPPINGS, c.toppings)}
            values={config.toppings}
            max={MAX_TOPPINGS}
            onToggle={toggleTopping}
          />
          {config.toppings.length >= MAX_TOPPINGS && (
            <p className="text-sm text-muted">{d.hints.toppingsFull}</p>
          )}
        </Section>
        <Section id="choose-sweetness" title={c.kinds.sweetness} hint={d.hints.sweetness}>
          <ChoiceGroup
            name="sweetness"
            choices={sweetness}
            value={config.sweetness}
            onChange={(value) => update({ sweetness: value })}
            swatches={false}
            priceText={null}
          />
        </Section>
        <Section id="choose-candles" title={c.kinds.candles} hint={dict.common.free}>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => update({ candles: config.candles - 1 })}
              disabled={config.candles === 0}
              aria-label={d.candles.fewer}
              className="btn btn-ghost h-12 w-12 p-0 text-2xl"
            >
              −
            </button>
            <output
              aria-live="polite"
              className="min-w-24 text-center font-display text-3xl font-bold tabular-nums"
            >
              {c.candles(config.candles)}
            </output>
            <button
              type="button"
              onClick={() => update({ candles: config.candles + 1 })}
              disabled={config.candles === MAX_CANDLES}
              aria-label={d.candles.more}
              className="btn btn-ghost h-12 w-12 p-0 text-2xl"
            >
              +
            </button>
          </div>
        </Section>
        <Section id="choose-message" title={c.kinds.message} hint={dict.common.free}>
          <label className="block space-y-2">
            <span className="sr-only">{c.kinds.message}</span>
            <input
              type="text"
              data-typing
              value={config.message}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder={d.message.placeholder}
              onChange={(event) => update({ message: cleanMessage(event.target.value) })}
              onBlur={() => update({ message: config.message.trim() })}
              className="field"
            />
            <span className="flex justify-between gap-3 text-xs text-muted">
              <span>{d.message.hint}</span>
              <span className="tabular-nums">
                {config.message.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </span>
          </label>
        </Section>

        <section aria-labelledby="recap-title" className="card space-y-5 p-5 sm:p-6">
          <h2 id="recap-title" className="font-display text-2xl font-bold">
            {d.summary.title}
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="chip rotate-[-2deg] border border-ink/70 text-sm" data-testid="lead-time">
              <span aria-hidden>⏰</span> {d.summary.lead(LEAD_HOURS[lead])}
            </span>
            <span className="text-sm text-muted">{d.summary.leadWhy[lead]}</span>
          </div>
          <div className="rounded-2xl bg-peach-soft p-4 text-sm leading-relaxed">
            <p className="font-semibold" data-testid="allergens">
              {allergenText(config, dict)}
            </p>
            <p className="mt-1">{dict.common.allergyNote}</p>
          </div>
          <div className="space-y-2">
            <button type="button" onClick={shareDesign} className="btn btn-ghost">
              <span aria-hidden>💌</span> {d.summary.share}
            </button>
            <p className="text-sm text-muted">{d.summary.shareHint}</p>
            {share && !share.url && <p className="text-sm font-semibold text-leaf">{d.summary.copied}</p>}
            {share?.url && (
              <label className="block space-y-1.5">
                <span className="block text-sm font-semibold">{d.summary.manual}</span>
                <input
                  ref={shareField}
                  readOnly
                  value={share.url}
                  aria-label={d.summary.linkLabel}
                  onFocus={(event) => event.currentTarget.select()}
                  className="field text-sm"
                />
              </label>
            )}
          </div>
          <details className="rounded-2xl border-2 border-line p-4 open:bg-cream">
            <summary className="cursor-pointer font-display text-lg font-bold">{d.summary.breakdown}</summary>
            <dl className="mt-3 space-y-1.5 text-sm">
              {lines.map((line) => (
                <div key={`${line.kind}-${line.id}`} className="flex justify-between gap-4">
                  <dt className="text-muted">{lineLabel(line, dict)}</dt>
                  <dd className="tabular-nums">{line.price ? money(line.price, lang) : dict.common.free}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 border-t-2 border-line pt-2 font-bold">
                <dt>{d.summary.total}</dt>
                <dd className="tabular-nums">{money(price, lang)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted">{d.summary.extrasFree}</p>
          </details>
          <button
            type="button"
            onClick={reset}
            className="text-sm font-semibold text-leaf underline underline-offset-4"
          >
            {d.summary.reset}
          </button>
        </section>

        {/* Sticky, not fixed: it stays with the choices and never lies over the footer. */}
        <div className="sticky bottom-0 z-30 -mx-3 border-t-2 border-ink bg-cream/95 px-4 py-3 backdrop-blur-xl sm:-mx-6 lg:bottom-6 lg:mx-0 lg:rounded-full lg:border-2 lg:bg-surface lg:py-2.5 lg:pr-2.5 lg:pl-6 lg:shadow-sticker">
          <div className="mx-auto flex max-w-xl items-center gap-3 lg:max-w-none">
            <div className="mr-auto min-w-0 leading-tight">
              <p className="truncate text-xs font-medium text-muted">{presetName}</p>
              <p className="flex items-center gap-2 font-display text-3xl font-extrabold tabular-nums max-[359px]:text-2xl">
                <span data-testid="price">
                  <TickingMoney value={price} />
                </span>
                <span className="chip font-sans whitespace-nowrap max-[379px]:hidden">
                  <span aria-hidden>⏰ {d.bar.lead(LEAD_HOURS[lead])}</span>
                  <span className="sr-only">{d.summary.lead(LEAD_HOURS[lead])}</span>
                </span>
              </p>
            </div>
            {justAdded ? (
              <LocalLink
                href="/cart"
                className="btn btn-ghost animate-pop whitespace-nowrap max-[359px]:px-4"
              >
                {d.bar.viewCart}
              </LocalLink>
            ) : (
              <button
                type="button"
                onClick={addToCart}
                className="btn btn-buy whitespace-nowrap max-[359px]:px-4"
              >
                {line ? d.bar.update : d.bar.add}
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
