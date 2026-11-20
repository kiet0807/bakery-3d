'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useDict, useLang } from '@/i18n/LangProvider'
import type { CartItem } from '@/lib/cart'
import { money } from '@/lib/money'
import {
  EMPTY_FORM,
  FIELDS,
  cleanForm,
  depositFor,
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
import { ORDERING_OPEN, SHOP } from '@/lib/shop'
import { getSmoothScroll } from '@/lib/smoothScroll'
import type { CheckoutKit } from './checkoutKit'
import { StepWhen } from './StepWhen'
import { StepWho } from './StepWho'

/** The current minute, read in the browser only, so slots close as time passes without a reload. */
const subscribeMinute = (onChange: () => void) => {
  const timer = window.setInterval(onChange, 20_000)
  return () => window.clearInterval(timer)
}
const readMinute = () => Math.floor(Date.now() / 60_000)

type Step = 1 | 2

/** The fields each step asks for, in screen order. "Next" checks only the first step's. */
const STEP_FIELDS: Record<Step, (keyof OrderForm)[]> = {
  1: ['name', 'phone', 'method', 'address'],
  2: ['date', 'time', 'payment', 'note'],
}
const stepOf = (field: keyof OrderForm): Step => (STEP_FIELDS[1].includes(field) ? 1 : 2)

/** Room left above a step when it is scrolled to: the fixed header is 64 px (80 from 640 px) high. */
const HEADER_ROOM = 96

/**
 * Who and how, then when and how to pay: two short steps instead of one long form (it was about 1,600 px on a
 * phone). Everything typed stays when moving between them. While the shop is not real (ORDERING_OPEN off) the
 * order goes nowhere and the page says so right above the button; when it opens, the button copies the order and
 * opens the shop's Zalo.
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
  const reduced = useReducedMotion()
  const prefix = useId()
  const ids = Object.fromEntries(FIELDS.map((field) => [field, `${prefix}-${field}`])) as Record<
    keyof OrderForm,
    string
  >
  const [form, setForm] = useState<OrderForm>(EMPTY_FORM)
  const [step, setStep] = useState<Step>(1)
  // The steps whose errors show: a step's errors appear once the visitor has tried to leave it, then follow
  // every change.
  const [tried, setTried] = useState<Step[]>([])
  const [manualText, setManualText] = useState<string | null>(null)
  const refs = useRef<Partial<Record<keyof OrderForm, HTMLElement | null>>>({})
  const box = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  // What gets the focus once the other step has rendered: its heading, or a field with an error.
  const focusNext = useRef<keyof OrderForm | 'heading' | null>(null)

  const minute = useSyncExternalStore(subscribeMinute, readMinute, () => 0)
  const now = minute ? new Date(minute * 60_000) : null

  const found: OrderErrors = tried.length && now ? validateOrder(form, { now, items }) : {}
  const errors: OrderErrors = Object.fromEntries(
    Object.entries(found).filter(([field]) => tried.includes(stepOf(field as keyof OrderForm))),
  )
  const stepErrors = STEP_FIELDS[step].filter((field) => errors[field]).length

  const message = (field: keyof OrderForm) => {
    const code = errors[field]
    if (!code) return undefined
    return (t.errors[field] as Partial<Record<FieldError, string>>)[code]
  }
  const kit: CheckoutKit = {
    form,
    set: (field, value) => setForm((current) => ({ ...current, [field]: value })),
    ids,
    prefix,
    errors,
    message,
    describedBy: (field, hasHint = true) =>
      [errors[field] && `${ids[field]}-error`, hasHint && `${ids[field]}-hint`].filter(Boolean).join(' ') ||
      undefined,
    register: (field) => (node) => {
      refs.current[field] = node
    },
  }

  const setMethod = (method: Method) =>
    setForm((current) => {
      // Keep the chosen time only if the new method still offers it.
      const keep = now && current.date ? slotsFor(current.date, { now, method, items }) : []
      return { ...current, method, time: keep.includes(current.time) ? current.time : '' }
    })

  const setDate = (date: string) =>
    setForm((current) => {
      // A new day keeps the time only if that day offers it, and a day that brings a deposit (a holiday)
      // unticks cash: the deposit is paid by transfer or MoMo.
      const keep = now && date ? slotsFor(date, { now, method: current.method, items }) : []
      const cashOff = current.payment === 'cod' && depositFor(items, date || undefined).amount > 0
      return {
        ...current,
        date,
        time: keep.includes(current.time) ? current.time : '',
        payment: cashOff ? '' : current.payment,
      }
    })

  // After a step change: focus its heading (a screen reader announces the new step) and bring its top into view
  // under the header if the visitor had scrolled down to the button; or focus the field that needs fixing.
  useEffect(() => {
    const target = focusNext.current
    focusNext.current = null
    if (!target) return
    if (target !== 'heading') {
      refs.current[target]?.focus()
      return
    }
    heading.current?.focus({ preventScroll: true })
    const top = box.current?.getBoundingClientRect().top
    if (top === undefined || (top >= HEADER_ROOM - 16 && top < window.innerHeight * 0.6)) return
    const y = window.scrollY + top - HEADER_ROOM
    const lenis = getSmoothScroll()
    if (lenis) lenis.scrollTo(y, { duration: 0.7, immediate: reduced })
    else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' })
  }, [step, reduced])

  const goTo = (next: Step, focus: keyof OrderForm | 'heading' = 'heading') => {
    focusNext.current = focus
    setStep(next)
  }

  const markTried = (...steps: Step[]) =>
    setTried((current) => [...new Set([...current, ...steps])].sort() as Step[])

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const placedAt = new Date()
    const check = validateOrder(form, { now: placedAt, items })

    // Step 1 (also reached by Enter in one of its fields): check its fields only, then move on.
    if (step === 1) {
      const first = STEP_FIELDS[1].find((field) => check[field])
      if (first) {
        markTried(1)
        refs.current[first]?.focus()
        return
      }
      goTo(2)
      return
    }

    const first = FIELDS.find((field) => check[field])
    if (first) {
      markTried(1, 2)
      // Step 1 was fine when it was left, so this is rare; send the visitor back to the field if it happens.
      if (stepOf(first) === 1) goTo(1, first)
      else refs.current[first]?.focus()
      return
    }
    const clean = cleanForm(form)
    const order: Order = { number: orderNumber(), form: clean, total, deposit: depositFor(items, clean.date) }
    if (!ORDERING_OPEN) {
      onPlaced(order)
      return
    }
    // Copy first; the receipt then offers a plain link to the shop's Zalo. Opening a window from inside the
    // promise would be blocked as a pop-up by Safari, and would take the focus the clipboard needs.
    const text = orderText({ order, items, dict, lang, origin: window.location.origin })
    navigator.clipboard.writeText(text).then(
      () => onPlaced(order),
      () => setManualText(text),
    )
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-6" aria-labelledby={`${prefix}-title`}>
      <div className="space-y-4">
        <h2 id={`${prefix}-title`} className="font-display text-3xl leading-tight font-extrabold">
          {t.title}
        </h2>
        <div aria-hidden className="grid grid-cols-2 gap-1.5">
          {([1, 2] as const).map((bar) => (
            <span key={bar} className="h-2 overflow-hidden rounded-full bg-cream-deep">
              <span
                className={`block h-full origin-left rounded-full bg-leaf transition-[scale] duration-500 ease-out ${
                  bar <= step ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </span>
          ))}
        </div>
      </div>

      <div ref={box} key={step} className="space-y-6 motion-safe:animate-[rise_0.45s_var(--ease-out)_both]">
        <h3 ref={heading} tabIndex={-1} className="font-display text-xl leading-tight font-bold outline-none">
          <span className="eyebrow block">{t.steps.count(step)}</span>{' '}
          {step === 1 ? t.steps.who : t.steps.when}
        </h3>

        {step === 1 ? (
          <StepWho kit={kit} onMethod={setMethod} />
        ) : (
          <StepWhen kit={kit} items={items} now={now} onDate={setDate} onEdit={() => goTo(1)} />
        )}

        {/*
          While the shop is not real: the full notice where the name, phone and address are typed (nothing of it is
          kept), and a one-line reminder right above the order button.
        */}
        {!ORDERING_OPEN &&
          (step === 1 ? (
            <p className="flex gap-3 rounded-2xl border-2 border-dashed border-ink bg-peach-soft p-4 text-sm leading-relaxed">
              <span aria-hidden className="text-lg leading-none">
                ✦
              </span>
              <span>{t.demo}</span>
            </p>
          ) : (
            <p className="flex items-start gap-2 text-sm leading-snug">
              <span aria-hidden className="chip shrink-0 -rotate-2 border border-ink bg-peach-soft">
                ✦
              </span>
              <span>{t.demoShort}</span>
            </p>
          ))}
        <div role="status" aria-live="polite">
          {stepErrors > 0 && <p className="text-sm font-medium text-error">{t.errors.summary(stepErrors)}</p>}
        </div>
        {step === 1 ? (
          <button type="submit" className="btn btn-buy w-full min-h-13 text-lg">
            {t.steps.next} <span aria-hidden>→</span>
          </button>
        ) : (
          <div className="space-y-3">
            <button type="submit" className="btn btn-buy w-full min-h-13 text-lg">
              {/* One run of text, so a narrow screen wraps it before the price, not around the dot. */}
              <span>
                {ORDERING_OPEN ? t.submitZalo : t.submitDemo} <span aria-hidden>·</span>{' '}
                <span className="whitespace-nowrap tabular-nums">{money(total, lang)}</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => goTo(1)}
              className="mx-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-leaf underline-offset-4 hover:underline"
            >
              <span aria-hidden>←</span> {t.steps.back}
            </button>
          </div>
        )}
      </div>

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
            <span className="sr-only"> {dict.common.newTab}</span>
          </a>
        </div>
      )}
    </form>
  )
}
