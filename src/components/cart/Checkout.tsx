'use client'

import { useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useDict, useLang } from '@/i18n/LangProvider'
import type { CartItem } from '@/lib/cart'
import { money } from '@/lib/money'
import {
  EMPTY_FORM,
  FIELDS,
  MAX_ADDRESS_LENGTH,
  MAX_NAME_LENGTH,
  MAX_NOTE_LENGTH,
  METHODS,
  PAYMENTS,
  cleanForm,
  dateRange,
  depositFor,
  earliestDate,
  formatDay,
  leadFor,
  orderNumber,
  orderText,
  slotsFor,
  validateOrder,
  type FieldError,
  type Method,
  type Order,
  type OrderErrors,
  type OrderForm,
} from '@/lib/order'
import { DELIVERY_AREAS, ORDERING_OPEN, SHOP } from '@/lib/shop'

/** The current minute, read in the browser only, so slots close as time passes without a reload. */
const subscribeMinute = (onChange: () => void) => {
  const timer = window.setInterval(onChange, 20_000)
  return () => window.clearInterval(timer)
}
const readMinute = () => Math.floor(Date.now() / 60_000)

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
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-display text-[0.95rem] font-bold">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-error">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

/** A radio card: the input is real and focusable; the card is its label. */
function OptionCard({
  name,
  value,
  checked,
  disabled,
  onChange,
  inputRef,
  describedBy,
  title,
  note,
}: {
  name: string
  value: string
  checked: boolean
  disabled?: boolean
  onChange: () => void
  inputRef?: (node: HTMLInputElement | null) => void
  describedBy?: string
  title: string
  note: string
}) {
  return (
    <label className={`group relative block ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        ref={inputRef}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        aria-describedby={describedBy}
        className="peer sr-only"
      />
      <span className="flex h-full flex-col gap-0.5 rounded-2xl border-2 border-edge bg-surface px-3.5 py-2.5 transition-[background-color,border-color,box-shadow] group-hover:border-ink peer-checked:border-ink peer-checked:bg-soft peer-checked:shadow-sticker peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-leaf peer-disabled:border-line peer-disabled:bg-cream peer-disabled:shadow-none">
        <span className="font-display text-[0.95rem] leading-tight font-bold">{title}</span>
        <span className="text-xs leading-snug text-muted">{note}</span>
      </span>
    </label>
  )
}

/**
 * Who, how, when and how to pay. While the shop is not real (ORDERING_OPEN off) the order goes nowhere and the
 * page says so right above the button; when it opens, the button copies the order and opens the shop's Zalo.
 */
export function Checkout({
  items,
  total,
  onPlaced,
}: {
  items: CartItem[]
  total: number
  onPlaced: (order: Order) => void
}) {
  const dict = useDict()
  const lang = useLang()
  const t = dict.cart.checkout
  const prefix = useId()
  const ids = Object.fromEntries(FIELDS.map((field) => [field, `${prefix}-${field}`])) as Record<
    keyof OrderForm,
    string
  >
  const [form, setForm] = useState<OrderForm>(EMPTY_FORM)
  const [attempted, setAttempted] = useState(false)
  const [manualText, setManualText] = useState<string | null>(null)
  const refs = useRef<Partial<Record<keyof OrderForm, HTMLElement | null>>>({})

  const minute = useSyncExternalStore(subscribeMinute, readMinute, () => 0)
  const now = minute ? new Date(minute * 60_000) : null
  const context = now ? { now, method: form.method, items } : null
  const range = now ? dateRange(now) : null
  const earliest = context ? earliestDate(context) : null
  const slots = context && form.date ? slotsFor(form.date, context) : []
  const lead = leadFor(items, form.date || undefined)
  const deposit = depositFor(items, form.date || undefined)

  // Errors show after the first try, then follow every change.
  const errors: OrderErrors = attempted && now ? validateOrder(form, { now, items }) : {}
  const errorCount = Object.keys(errors).length
  const message = (field: keyof OrderForm) => {
    const code = errors[field]
    if (!code) return undefined
    return (t.errors[field] as Partial<Record<FieldError, string>>)[code]
  }
  const describedBy = (field: keyof OrderForm, hasHint = true) =>
    errors[field] ? `${ids[field]}-error` : hasHint ? `${ids[field]}-hint` : undefined

  const set = <K extends keyof OrderForm>(field: K, value: OrderForm[K]) =>
    setForm((current) => ({ ...current, [field]: value }))

  const setMethod = (method: Method) =>
    setForm((current) => {
      // Keep the chosen time only if the new method still offers it.
      const keep = now && current.date ? slotsFor(current.date, { now, method, items }) : []
      return { ...current, method, time: keep.includes(current.time) ? current.time : '' }
    })

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const placedAt = new Date()
    const found = validateOrder(form, { now: placedAt, items })
    const first = FIELDS.find((field) => found[field])
    if (first) {
      setAttempted(true)
      refs.current[first]?.focus()
      return
    }
    const clean = cleanForm(form)
    const order: Order = { number: orderNumber(), form: clean, total, deposit: depositFor(items, clean.date) }
    if (!ORDERING_OPEN) {
      onPlaced(order)
      return
    }
    const text = orderText({ order, items, dict, lang, origin: window.location.origin })
    navigator.clipboard.writeText(text).then(
      () => {
        window.open(SHOP.zalo, '_blank', 'noopener,noreferrer')
        onPlaced(order)
      },
      () => setManualText(text),
    )
  }

  const reasons = deposit.reasons.map((reason) => t.deposit.reasons[reason]).join(', ')

  return (
    <form noValidate onSubmit={submit} className="space-y-6" aria-labelledby={`${prefix}-title`}>
      <div className="space-y-3">
        <h2 id={`${prefix}-title`} className="font-display text-3xl leading-tight font-extrabold">
          {t.title}
        </h2>
        <p className="flex flex-wrap gap-2">
          <span className="inline-flex -rotate-1 items-center gap-1.5 rounded-full border-2 border-ink bg-butter px-3 py-1 text-sm font-semibold">
            <span aria-hidden>⏱</span> {lead.holiday ? t.holidayLead : t.lead[lead.kind]}
          </span>
        </p>
        {lead.kind === 'menu' && !lead.holiday && <p className="text-xs text-muted">{t.sameDay}</p>}
      </div>

      <Field id={ids.name} label={t.name.label} hint={t.name.hint} error={message('name')}>
        <input
          ref={(node) => void (refs.current.name = node)}
          id={ids.name}
          type="text"
          autoComplete="name"
          maxLength={MAX_NAME_LENGTH}
          value={form.name}
          onChange={(event) => set('name', event.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describedBy('name')}
          placeholder={t.name.placeholder}
          className="field"
        />
      </Field>

      <Field id={ids.phone} label={t.phone.label} hint={t.phone.hint} error={message('phone')}>
        <input
          ref={(node) => void (refs.current.phone = node)}
          id={ids.phone}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          value={form.phone}
          onChange={(event) => set('phone', event.target.value)}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={describedBy('phone')}
          placeholder={t.phone.placeholder}
          className="field tabular-nums"
        />
      </Field>

      <fieldset className="space-y-2" aria-describedby={errors.method ? `${ids.method}-error` : undefined}>
        <legend className="mb-2 font-display text-[0.95rem] font-bold">{t.method.legend}</legend>
        <div className="grid grid-cols-2 gap-2">
          {METHODS.map((method, index) => (
            <OptionCard
              key={method}
              name={`${prefix}-method`}
              value={method}
              checked={form.method === method}
              onChange={() => setMethod(method)}
              inputRef={index === 0 ? (node) => void (refs.current.method = node) : undefined}
              title={t.method[method]}
              note={t.method.notes[method]}
            />
          ))}
        </div>
        {errors.method && (
          <p id={`${ids.method}-error`} className="text-sm font-medium text-error">
            {message('method')}
          </p>
        )}
      </fieldset>

      {form.method === 'delivery' && (
        <div className="space-y-4 rounded-2xl bg-soft p-4">
          <Field id={ids.address} label={t.address.label} hint={t.address.hint} error={message('address')}>
            <input
              ref={(node) => void (refs.current.address = node)}
              id={ids.address}
              type="text"
              autoComplete="street-address"
              maxLength={MAX_ADDRESS_LENGTH}
              value={form.address}
              onChange={(event) => set('address', event.target.value)}
              aria-invalid={Boolean(errors.address)}
              aria-describedby={describedBy('address')}
              placeholder={t.address.placeholder}
              className="field"
            />
          </Field>
          <div className="space-y-1.5 text-sm leading-relaxed">
            <p className="font-display font-bold">{t.delivery.title}</p>
            <p className="text-muted">
              {t.delivery.areas}: {DELIVERY_AREAS.join(', ')}.
            </p>
            <p>{t.delivery.fee}</p>
            <p className="text-muted">{t.delivery.car}</p>
          </div>
        </div>
      )}

      <div className="grid gap-5 min-[420px]:grid-cols-2">
        <Field
          id={ids.date}
          label={t.date.label}
          hint={earliest ? t.date.earliest(formatDay(earliest, lang)) : now ? t.date.none : undefined}
          error={message('date')}
        >
          <input
            ref={(node) => void (refs.current.date = node)}
            id={ids.date}
            type="date"
            min={earliest ?? range?.min}
            max={range?.max}
            value={form.date}
            onChange={(event) => set('date', event.target.value)}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={describedBy('date')}
            className="field min-h-12"
          />
        </Field>
        <Field
          id={ids.time}
          label={t.time.label}
          hint={form.date && !slots.length ? t.time.none : undefined}
          error={message('time')}
        >
          <select
            ref={(node) => void (refs.current.time = node)}
            id={ids.time}
            value={form.time}
            onChange={(event) => set('time', event.target.value)}
            aria-invalid={Boolean(errors.time)}
            aria-describedby={describedBy('time', Boolean(form.date && !slots.length))}
            className="field min-h-12"
          >
            <option value="">{form.date ? t.time.choose : t.time.pickDate}</option>
            {slots.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
            {form.time && !slots.includes(form.time) && (
              <option value={form.time} disabled>
                {form.time}
              </option>
            )}
          </select>
        </Field>
      </div>

      <fieldset className="space-y-2" aria-describedby={`${ids.payment}-deposit`}>
        <legend className="mb-2 font-display text-[0.95rem] font-bold">{t.payment.legend}</legend>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
          {PAYMENTS.map((payment, index) => (
            <OptionCard
              key={payment}
              name={`${prefix}-payment`}
              value={payment}
              checked={form.payment === payment}
              disabled={payment === 'cod' && deposit.amount > 0}
              onChange={() => set('payment', payment)}
              inputRef={
                index === (deposit.amount > 0 ? 1 : 0)
                  ? (node) => void (refs.current.payment = node)
                  : undefined
              }
              describedBy={errors.payment ? `${ids.payment}-error` : undefined}
              title={t.payment[payment]}
              note={
                payment === 'cod' && deposit.amount > 0 ? t.payment.codWithDeposit : t.payment.notes[payment]
              }
            />
          ))}
        </div>
        {errors.payment && (
          <p id={`${ids.payment}-error`} className="text-sm font-medium text-error">
            {message('payment')}
          </p>
        )}
        <div id={`${ids.payment}-deposit`} className="rounded-2xl bg-butter-soft p-4 text-sm leading-relaxed">
          {deposit.amount > 0 ? (
            <>
              <p className="font-display font-bold">{t.deposit.title}</p>
              <p>{t.deposit.because(reasons)}</p>
              <dl className="mt-2 space-y-1">
                <div className="flex justify-between gap-4">
                  <dt>{t.deposit.now}</dt>
                  <dd className="font-semibold tabular-nums">{money(deposit.amount, lang)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>{t.deposit.later}</dt>
                  <dd className="font-semibold tabular-nums">{money(deposit.rest, lang)}</dd>
                </div>
              </dl>
            </>
          ) : (
            <p>{t.deposit.none}</p>
          )}
        </div>
      </fieldset>

      <Field
        id={ids.note}
        label={t.note.label}
        hint={
          <span className="tabular-nums">
            {form.note.length}/{MAX_NOTE_LENGTH}
          </span>
        }
        error={message('note')}
      >
        <textarea
          ref={(node) => void (refs.current.note = node)}
          id={ids.note}
          rows={3}
          maxLength={MAX_NOTE_LENGTH}
          value={form.note}
          onChange={(event) => set('note', event.target.value)}
          aria-invalid={Boolean(errors.note)}
          aria-describedby={describedBy('note')}
          placeholder={t.note.placeholder}
          className="field resize-y"
        />
      </Field>

      {!ORDERING_OPEN && (
        <p className="flex gap-3 rounded-2xl border-2 border-dashed border-ink bg-peach-soft p-4 text-sm leading-relaxed">
          <span aria-hidden className="text-lg leading-none">
            ✦
          </span>
          <span>{t.demo}</span>
        </p>
      )}
      <div role="status" aria-live="polite">
        {errorCount > 0 && <p className="text-sm font-medium text-error">{t.errors.summary(errorCount)}</p>}
      </div>
      <button type="submit" className="btn btn-buy w-full min-h-13 text-lg">
        {ORDERING_OPEN ? t.submitZalo : t.submitDemo} <span aria-hidden>·</span>{' '}
        <span className="tabular-nums">{money(total, lang)}</span>
      </button>

      {manualText && (
        <div className="space-y-2" role="alert">
          <p className="text-sm">{t.zaloManual}</p>
          <label className="sr-only" htmlFor={`${prefix}-manual`}>
            {t.zaloText}
          </label>
          <textarea
            id={`${prefix}-manual`}
            readOnly
            rows={8}
            value={manualText}
            onFocus={(event) => event.currentTarget.select()}
            className="field text-sm"
          />
          <a className="btn btn-ghost" href={SHOP.zalo} target="_blank" rel="noopener noreferrer">
            {t.zaloOpen}
          </a>
        </div>
      )}
    </form>
  )
}
