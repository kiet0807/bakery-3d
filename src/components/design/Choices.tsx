'use client'

import type { Choice } from '@/lib/cake'
import { money } from '@/lib/money'

const priceLabel = (price: number) => (price ? `+${money(price)}` : 'Included')

function Swatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="h-7 w-7 shrink-0 rounded-full border border-black/10 shadow-[inset_0_-3px_6px_rgb(0_0_0/0.12),inset_0_3px_6px_rgb(255_255_255/0.6)]"
      style={{ background: color }}
    />
  )
}

export function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 flex w-full items-baseline justify-between gap-3">
        <span className="text-2xl font-light">{title}</span>
        {hint && <span className="text-xs text-mist">{hint}</span>}
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
}: {
  name: string
  choices: Choice<Id>[]
  value: Id
  onChange: (id: Id) => void
  swatches?: boolean
  detail?: (choice: Choice<Id>) => string
}) {
  return (
    <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
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
          <span className="flex h-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-all group-hover:border-white/25 peer-checked:border-moon peer-checked:bg-white/[0.08] peer-checked:shadow-soft peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-moon">
            {swatches && <Swatch color={choice.color} />}
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{choice.name}</span>
              <span className="block truncate text-xs text-mist">
                {detail ? detail(choice) : choice.note}
              </span>
            </span>
            <span className="text-xs font-semibold text-mist tabular-nums">{priceLabel(choice.price)}</span>
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
  choices: Choice<Id>[]
  values: Id[]
  max: number
  onToggle: (id: Id) => void
}) {
  const full = values.length >= max
  return (
    <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
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
            <span className="flex h-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-all group-hover:border-white/25 peer-checked:border-moon peer-checked:bg-white/[0.08] peer-checked:shadow-soft peer-disabled:opacity-45 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-moon">
              <Swatch color={choice.color} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{choice.name}</span>
                <span className="block truncate text-xs text-mist">{choice.note}</span>
              </span>
              <span
                aria-hidden
                className={`grid h-5 w-5 place-items-center rounded-md border text-[11px] font-bold ${
                  checked ? 'border-moon bg-moon text-night' : 'border-white/20 text-transparent'
                }`}
              >
                ✓
              </span>
              <span className="text-xs font-semibold text-mist tabular-nums">{priceLabel(choice.price)}</span>
            </span>
          </label>
        )
      })}
    </div>
  )
}
