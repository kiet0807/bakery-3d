/** Pickup slots offered by the demo checkout. */
export const PICKUP_TIMES = ['10:00', '12:00', '14:00', '16:00', '18:00'] as const
export type PickupTime = (typeof PICKUP_TIMES)[number]

export const MAX_NAME_LENGTH = 60
export const MIN_NAME_LENGTH = 2
export const MAX_NOTE_LENGTH = 200
/** The furthest pickup day, counted from today. */
export const MAX_PICKUP_DAYS = 30

export interface OrderForm {
  name: string
  /** Local date, YYYY-MM-DD. */
  date: string
  time: string
  note: string
}

export type OrderErrors = Partial<Record<keyof OrderForm, string>>

export interface Order {
  number: string
  form: OrderForm
}

const pad = (n: number) => String(n).padStart(2, '0')

/** A date as YYYY-MM-DD in the visitor's own time zone (not UTC). */
export function localDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** The local date `days` after `from`, as YYYY-MM-DD. Safe across month ends and daylight saving changes. */
export function addDays(from: Date, days: number): string {
  return localDate(new Date(from.getFullYear(), from.getMonth(), from.getDate() + days, 12))
}

/** First and last day a cake can be picked up. Same-day orders are not taken. */
export function pickupRange(today: Date): { min: string; max: string } {
  return { min: addDays(today, 1), max: addDays(today, MAX_PICKUP_DAYS) }
}

const DATE = /^\d{4}-\d{2}-\d{2}$/

/** Field by field messages; an empty object means the order can be placed. */
export function validateOrder(input: OrderForm, today: Date): OrderErrors {
  const errors: OrderErrors = {}
  const name = input.name.trim()
  if (!name) errors.name = 'Add a name for the order.'
  else if (name.length < MIN_NAME_LENGTH) errors.name = `Use at least ${MIN_NAME_LENGTH} characters.`
  else if (name.length > MAX_NAME_LENGTH) errors.name = `Keep it to ${MAX_NAME_LENGTH} characters.`

  const { min, max } = pickupRange(today)
  if (!input.date) errors.date = 'Choose a pickup day.'
  else if (!DATE.test(input.date)) errors.date = 'Use a date like 2026-12-24.'
  else if (input.date < min) errors.date = 'The earliest pickup is tomorrow.'
  else if (input.date > max) errors.date = `Pick a day within the next ${MAX_PICKUP_DAYS} days.`

  if (!PICKUP_TIMES.includes(input.time as PickupTime)) errors.time = 'Choose a pickup time.'

  if (input.note.length > MAX_NOTE_LENGTH) errors.note = `Keep the note to ${MAX_NOTE_LENGTH} characters.`
  return errors
}

/** A short order reference such as "CC-4821". Only for show: no order is stored anywhere. */
export function orderNumber(): string {
  let n: number
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    n = crypto.getRandomValues(new Uint32Array(1))[0] % 10000
  } else {
    n = Math.floor(Math.random() * 10000)
  }
  return `CC-${String(n).padStart(4, '0')}`
}

/** "Thursday 24 December" for a YYYY-MM-DD local date. */
export function formatPickupDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m || !d) return date
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(y, m - 1, d, 12),
  )
}
