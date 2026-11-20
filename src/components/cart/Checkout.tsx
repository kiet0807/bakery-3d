'use client'

import { useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { money } from '@/lib/money'
import {
  MAX_NAME_LENGTH,
  MAX_NOTE_LENGTH,
  PICKUP_TIMES,
  localDate,
  orderNumber,
  pickupRange,
  validateOrder,
  type Order,
  type OrderErrors,
  type OrderForm,
} from '@/lib/order'

const noSubscription = () => () => {}
/** Today's local date, read in the browser only; stable for the whole day, so it is a safe snapshot. */
const readToday = () => localDate(new Date())

const EMPTY: OrderForm = { name: '', date: '', time: '', note: '' }
const FIELDS: (keyof OrderForm)[] = ['name', 'date', 'time', 'note']

const control =
  'w-full rounded-2xl border bg-white/[0.06] px-4 py-3 text-base outline-none placeholder:text-haze focus:border-moon aria-[invalid=true]:border-energy'

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: ReactNode
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-energy">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-haze">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

/** Pickup details and the demo "pay" button. Nothing leaves the browser. */
export function Checkout({ total, onPlaced }: { total: number; onPlaced: (order: Order) => void }) {
  const prefix = useId()
  const ids = Object.fromEntries(FIELDS.map((field) => [field, `${prefix}-${field}`])) as Record<
    keyof OrderForm,
    string
  >
  const [form, setForm] = useState<OrderForm>(EMPTY)
  const [attempted, setAttempted] = useState(false)
  const todayKey = useSyncExternalStore(noSubscription, readToday, () => '')
  const today = useMemo(() => {
    const [y, m, d] = todayKey.split('-').map(Number)
    return y ? new Date(y, m - 1, d, 12) : null
  }, [todayKey])
  const range = today ? pickupRange(today) : null
  // Errors show after the first try, then follow every change.
  const errors: OrderErrors = attempted && today ? validateOrder(form, today) : {}
  const errorCount = Object.keys(errors).length
  const refs = useRef<Partial<Record<keyof OrderForm, HTMLElement | null>>>({})

  const set = (field: keyof OrderForm) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }))

  const describedBy = (field: keyof OrderForm, hasHint = true) =>
    errors[field] ? `${ids[field]}-error` : hasHint ? `${ids[field]}-hint` : undefined

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found = validateOrder(form, new Date())
    const first = FIELDS.find((field) => found[field])
    if (first) {
      setAttempted(true)
      refs.current[first]?.focus()
      return
    }
    onPlaced({ number: orderNumber(), form: { ...form, name: form.name.trim(), note: form.note.trim() } })
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-5" aria-labelledby={`${prefix}-title`}>
      <h2 id={`${prefix}-title`} className="text-2xl font-light">
        Pickup
      </h2>
      <Field
        id={ids.name}
        label="Name on the order"
        hint="Any name works: it only goes on the box label."
        error={errors.name}
      >
        <input
          ref={(node) => void (refs.current.name = node)}
          id={ids.name}
          type="text"
          autoComplete="off"
          maxLength={MAX_NAME_LENGTH}
          value={form.name}
          onChange={(event) => set('name')(event.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describedBy('name')}
          placeholder="Linh"
          className={`${control} border-white/15`}
        />
      </Field>
      <div className="grid gap-5 min-[420px]:grid-cols-2">
        <Field id={ids.date} label="Pickup day" hint="Tomorrow or later." error={errors.date}>
          <input
            ref={(node) => void (refs.current.date = node)}
            id={ids.date}
            type="date"
            min={range?.min}
            max={range?.max}
            value={form.date}
            onChange={(event) => set('date')(event.target.value)}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={describedBy('date')}
            className={`${control} min-h-12 border-white/15 [color-scheme:dark]`}
          />
        </Field>
        <Field id={ids.time} label="Pickup time" error={errors.time}>
          <select
            ref={(node) => void (refs.current.time = node)}
            id={ids.time}
            value={form.time}
            onChange={(event) => set('time')(event.target.value)}
            aria-invalid={Boolean(errors.time)}
            aria-describedby={describedBy('time', false)}
            className={`${control} min-h-12 border-white/15 [color-scheme:dark]`}
          >
            <option value="">Choose a time</option>
            {PICKUP_TIMES.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field
        id={ids.note}
        label="Note for the baker (optional)"
        hint={
          <span className="tabular-nums">
            {form.note.length}/{MAX_NOTE_LENGTH}
          </span>
        }
        error={errors.note}
      >
        <textarea
          ref={(node) => void (refs.current.note = node)}
          id={ids.note}
          rows={3}
          maxLength={MAX_NOTE_LENGTH}
          value={form.note}
          onChange={(event) => set('note')(event.target.value)}
          aria-invalid={Boolean(errors.note)}
          aria-describedby={describedBy('note')}
          placeholder="Less sweet, please."
          className={`${control} resize-y border-white/15`}
        />
      </Field>

      <p className="rounded-2xl border border-moon/30 bg-moon/10 p-4 text-sm leading-relaxed">
        <strong className="font-semibold">Demo checkout:</strong> nothing is sent and no payment is taken. No
        card details are asked for.
      </p>
      <div role="status" aria-live="polite">
        {errorCount > 0 && (
          <p className="text-sm text-energy">
            Please check {errorCount === 1 ? 'one field' : `${errorCount} fields`} above.
          </p>
        )}
      </div>
      <button
        type="submit"
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-glow px-6 py-3 font-semibold text-night shadow-warm transition-transform hover:-translate-y-0.5"
      >
        Place demo order <span aria-hidden>·</span> <span className="tabular-nums">{money(total)}</span>
      </button>
    </form>
  )
}
