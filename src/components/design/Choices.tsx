'use client'

import type { ReactNode } from 'react'
import { useDict, useLang } from '@/i18n/LangProvider'
import { money } from '@/lib/money'

/** A choice ready to show: its words from the dictionary and its price for the chosen size. */
export interface ChoiceView<Id extends string> {
  id: Id
  name: string
  note: string
  price: number
  color: string
}

/** "+30.000đ", or "Miễn phí" for a choice that costs nothing extra. */
function usePriceLabel() {
  const lang = useLang()
  const { common } = useDict()
  return (price: number) => (price ? `+${money(price, lang)}` : common.free)
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="h-8 w-8 shrink-0 rounded-full border-2 border-ink/15 shadow-[inset_0_-3px_6px_rgb(0_0_0/0.12),inset_0_3px_6px_rgb(255_255_255/0.6)]"
      style={{ background: color }}
    />
  )
}

/** The tick in the corner of a chosen card: the choice is shown by shape too, not by colour alone. */
function Tick({ square = false }: { square?: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid h-6 w-6 shrink-0 place-items-center border-2 border-ink text-xs font-bold transition-colors ${
        square ? 'rounded-lg' : 'rounded-full'
      } bg-surface text-transparent group-has-checked:bg-leaf group-has-checked:text-white`}
    >
      ✓
    </span>
  )
}

/** The card behind each radio or checkbox. The input before it is `peer sr-only`. */
const CARD =
  'flex h-full items-center gap-3 rounded-2xl border-2 border-line bg-surface p-3 transition-[border-color,background-color,box-shadow,transform] group-hover:border-edge peer-checked:border-ink peer-checked:bg-butter-soft peer-checked:shadow-sticker peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-leaf motion-safe:peer-checked:-translate-y-0.5'

export function Section({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 flex w-full flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-display text-2xl font-bold">{title}</span>
        {hint && <span className="text-sm font-medium text-muted">{hint}</span>}
      </legend>
      {children}
    </fieldset>
  )
}

/** One choice out of several, as large tappable cards backed by real radio buttons. */
export function ChoiceGroup<Id extends string>({
  name,
  choices,
  value,
  onChange,
  swatches = true,
  detail,
  priceText,
  columns = 2,
}: {
  name: string
  choices: ChoiceView<Id>[]
  value: Id
  onChange: (id: Id) => void
  swatches?: boolean
  detail?: (choice: ChoiceView<Id>) => string
  /** How to write the price; by default a surcharge ("+30.000đ" or "Miễn phí"). Null hides it. */
  priceText?: ((choice: ChoiceView<Id>) => string) | null
  columns?: 2 | 3
}) {
  const priceLabel = usePriceLabel()
  const label = priceText === undefined ? (choice: ChoiceView<Id>) => priceLabel(choice.price) : priceText
  return (
    <div
      className={`grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 ${columns === 3 ? 'xl:grid-cols-3' : ''}`}
    >
      {choices.map((choice) => (
        <label key={choice.id} className="group relative cursor-pointer">
          <input
            type="radio"
            name={name}
            value={choice.id}
            checked={value === choice.id}
            onChange={() => onChange(choice.id)}
            className="peer sr-only"
          />
          <span className={CARD}>
            {swatches && <Swatch color={choice.color} />}
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[1.05rem] leading-tight font-bold">{choice.name}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted">
                {detail ? detail(choice) : choice.note}
              </span>
              {label && (
                <span className="mt-1 block text-xs font-semibold text-ink tabular-nums">
                  {label(choice)}
                </span>
              )}
            </span>
            <Tick />
          </span>
        </label>
      ))}
    </div>
  )
}

/** Several choices with a cap, as checkbox cards. */
export function MultiChoiceGroup<Id extends string>({
  choices,
  values,
  max,
  onToggle,
}: {
  choices: ChoiceView<Id>[]
  values: Id[]
  max: number
  onToggle: (id: Id) => void
}) {
  const priceLabel = usePriceLabel()
  const full = values.length >= max
  return (
    <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
      {choices.map((choice) => {
        const checked = values.includes(choice.id)
        const disabled = full && !checked
        return (
          <label
            key={choice.id}
            className={`group relative ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={() => onToggle(choice.id)}
              className="peer sr-only"
            />
            <span className={`${CARD} peer-disabled:opacity-50`}>
              <Swatch color={choice.color} />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[1.05rem] leading-tight font-bold">
                  {choice.name}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-muted">{choice.note}</span>
                <span className="mt-1 block text-xs font-semibold text-ink tabular-nums">
                  {priceLabel(choice.price)}
                </span>
              </span>
              <Tick square />
            </span>
          </label>
        )
      })}
    </div>
  )
}
