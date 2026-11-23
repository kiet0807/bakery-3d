import { describeCake } from '@/i18n/cake-text'
import { localeHref, type Locale } from '@/i18n/config'
import type { ClientDictionary } from '@/i18n/dictionaries'
import { formatMoney } from '@/i18n/format'
import { priceOf, sizeOf, type CakeConfig } from './cake'
import { LEAD_HOURS, SAME_DAY_CUTOFF, leadKind, type LeadKind } from './leadTime'
import { presetById } from './presets'
import { designPath } from './share'
import { SHOP } from './shop'

/*
 * Checkout rules (PLAN.md section 6). Everything is reckoned on the shop's clock (Asia/Ho_Chi_Minh), never the
 * visitor's: someone abroad ordering for family in Thủ Đức gets the same slots as someone next door.
 * Vietnam has no daylight saving, so arithmetic on the shop's wall-clock time is exact.
 * This file holds no words: validation returns error codes, and the cart dictionary turns them into sentences.
 */

export type Method = 'pickup' | 'delivery'
export type Payment = 'cod' | 'transfer' | 'momo'

export const METHODS: Method[] = ['pickup', 'delivery']
export const PAYMENTS: Payment[] = ['cod', 'transfer', 'momo']

export const MIN_NAME_LENGTH = 2
export const MAX_NAME_LENGTH = 60
export const MAX_ADDRESS_LENGTH = 200
export const MAX_NOTE_LENGTH = 200
/** The furthest day an order can be for, counted from today in shop time. */
export const MAX_DAYS_AHEAD = 30
/** Orders from this total (in đồng) pay half up front. */
export const DEPOSIT_FROM = 1_000_000
export const DEPOSIT_SHARE = 0.5
/** Holidays (MM-DD) when every order needs two days' notice and a deposit; the days around Tết are added below. */
export const HOLIDAYS = ['01-01', '02-14', '03-08', '06-01', '10-20', '11-20', '12-24', '12-25'] as const
const HOLIDAY_HOURS = 48
const SLOT_MINUTES = 30

export interface OrderForm {
  name: string
  phone: string
  method: Method
  address: string
  /** Shop date, YYYY-MM-DD. */
  date: string
  /** HH:MM, one of the slots for the method. */
  time: string
  payment: Payment | ''
  note: string
}

/** What a line of the cart contributes to the rules. */
export interface OrderItem {
  config: CakeConfig
  presetId?: string
  quantity: number
}

export type FieldError =
  | 'required'
  | 'tooShort'
  | 'tooLong'
  | 'invalid'
  | 'tooSoon'
  | 'tooFar'
  | 'unavailable'
  | 'depositNeedsTransfer'

export type OrderErrors = Partial<Record<keyof OrderForm, FieldError>>

/** The order of the fields on screen: the first one with an error gets the focus. */
export const FIELDS: (keyof OrderForm)[] = [
  'name',
  'phone',
  'method',
  'address',
  'date',
  'time',
  'payment',
  'note',
]

export const EMPTY_FORM: OrderForm = {
  name: '',
  phone: '',
  method: 'pickup',
  address: '',
  date: '',
  time: '',
  payment: '',
  note: '',
}

// ---------------------------------------------------------------------------------------------------------
// The shop's clock

const pad = (n: number) => String(n).padStart(2, '0')

const shopClock = new Intl.DateTimeFormat('en-CA', {
  timeZone: SHOP.timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/**
 * The shop's wall-clock time for an instant, as milliseconds of a fake UTC date. Comparing and adding to these
 * numbers is comparing and adding shop clock times.
 */
export function shopWall(now: Date): number {
  const parts = Object.fromEntries(shopClock.formatToParts(now).map((part) => [part.type, part.value]))
  return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute)
}

/** A shop date and time as the same kind of number. */
const wallOf = (date: string, time = '00:00') => {
  const [y, m, d] = date.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  return Date.UTC(y, m - 1, d, h, min)
}

const dateOfWall = (wall: number) => {
  const d = new Date(wall)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

const DATE = /^\d{4}-\d{2}-\d{2}$/
/** YYYY-MM-DD and a real day of the calendar (no 30 February). */
const isDate = (date: string) => DATE.test(date) && dateOfWall(wallOf(date)) === date

const timeOfWall = (wall: number) => {
  const d = new Date(wall)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

/** Today's date in the shop. */
export const shopToday = (now: Date) => dateOfWall(shopWall(now))

/** The shop date `days` after `date`. */
export const addShopDays = (date: string, days: number) => dateOfWall(wallOf(date) + days * 86_400_000)

/** First and last day an order can be for. */
export function dateRange(now: Date): { min: string; max: string } {
  const today = shopToday(now)
  return { min: today, max: addShopDays(today, MAX_DAYS_AHEAD) }
}

/**
 * The first day of Tết (Lunar New Year) for the years the 30-day order window can reach. It moves with the
 * lunar calendar, so the dates are listed rather than computed; add the next year before the last one passes.
 * These are Vietnam's dates (the lunar calendar reckoned at UTC+7, Hồ Ngọc Đức's algorithm): in 2030 Tết falls
 * on 2 February, a day before the Chinese New Year, because the new moon comes just before midnight here.
 */
export const TET_DAYS = [
  '2027-02-06',
  '2028-01-26',
  '2029-02-13',
  '2030-02-02',
  '2031-01-23',
  '2032-02-11',
] as const
/** "Cận Tết": the week before Tết counts as a holiday, from the 23rd of the last lunar month or so. */
export const TET_RUSH_DAYS = 7
/** So do the first days of the year (mùng 1 to mùng 3): they used to be ordinary days, right after a week of holidays. */
export const TET_DAYS_OFF = 3

const nearTet = (date: string) =>
  TET_DAYS.some((tet) => date >= addShopDays(tet, -TET_RUSH_DAYS) && date < addShopDays(tet, TET_DAYS_OFF))

export const isHoliday = (date: string) =>
  (HOLIDAYS as readonly string[]).includes(date.slice(5)) || nearTet(date)

// ---------------------------------------------------------------------------------------------------------
// Slots and lead time

/** Every 30-minute mark from `first` to `last`, both inclusive when they fall on a mark. */
function slotsBetween(first: string, last: string): string[] {
  const step = SLOT_MINUTES * 60_000
  const slots: string[] = []
  for (
    let wall = Math.ceil(wallOf('2000-01-01', first) / step) * step;
    wall <= wallOf('2000-01-01', last);
    wall += step
  )
    slots.push(timeOfWall(wall))
  return slots
}

/**
 * Every slot of the day: pickup every 30 minutes while the shop is open (6:30 to the last half hour before
 * 22:45), delivery while the riders run. Both come from `SHOP`, so the hours shown and the slots agree.
 */
export const SLOTS: Record<Method, string[]> = {
  pickup: slotsBetween(SHOP.hours.open, SHOP.hours.close),
  delivery: slotsBetween(SHOP.deliveryHours.first, SHOP.deliveryHours.last),
}

/** The order is as slow as its slowest cake. */
export function orderLeadKind(items: OrderItem[]): LeadKind {
  const order: LeadKind[] = ['menu', 'custom', 'tiered']
  return items.reduce<LeadKind>((slowest, item) => {
    const kind = leadKind(item.config, item.presetId)
    return order.indexOf(kind) > order.indexOf(slowest) ? kind : slowest
  }, 'menu')
}

/** Why an order needs the notice it needs: the slowest cake, or a holiday that overrides it. */
export interface Lead {
  kind: LeadKind
  hours: number
  holiday: boolean
}

export function leadFor(items: OrderItem[], date?: string): Lead {
  const kind = orderLeadKind(items)
  const holiday = Boolean(date && isHoliday(date))
  return { kind, hours: Math.max(LEAD_HOURS[kind], holiday ? HOLIDAY_HOURS : 0), holiday }
}

export interface SlotContext {
  now: Date
  method: Method
  items: OrderItem[]
}

/** The slots still open on a date for this cart. */
export function slotsFor(date: string, { now, method, items }: SlotContext): string[] {
  if (!isDate(date)) return []
  const { min, max } = dateRange(now)
  if (date < min || date > max) return []
  const nowWall = shopWall(now)
  const lead = leadFor(items, date)
  const earliest = nowWall + lead.hours * 3_600_000
  // Menu cakes can still be made today, but only for orders placed before the cutoff.
  if (date === min && lead.kind === 'menu' && nowWall >= wallOf(min, SAME_DAY_CUTOFF)) return []
  return SLOTS[method].filter((time) => wallOf(date, time) >= earliest)
}

/** The first day with an open slot, or null if none within the window. */
export function earliestDate(context: SlotContext): string | null {
  return dateChoices(context, 1)[0] ?? null
}

/**
 * The first `count` days that still have an open slot for this cart, earliest first: the quick picks of the
 * checkout. A day with nothing left (a holiday inside its 48 hours, today after the cutoff) is skipped, not
 * shown as a dead option.
 */
export function dateChoices(context: SlotContext, count: number): string[] {
  const { min } = dateRange(context.now)
  const days: string[] = []
  for (let day = 0; day <= MAX_DAYS_AHEAD && days.length < count; day++) {
    const date = addShopDays(min, day)
    if (slotsFor(date, context).length) days.push(date)
  }
  return days
}

// ---------------------------------------------------------------------------------------------------------
// Money

export const orderTotal = (items: OrderItem[]) =>
  items.reduce((sum, item) => sum + priceOf(item.config) * item.quantity, 0)

export type DepositReason = 'tiered' | 'total' | 'holiday'

export interface Deposit {
  /** Đồng to pay up front; 0 when no deposit is needed. */
  amount: number
  /** What is left to pay on receipt. */
  rest: number
  reasons: DepositReason[]
}

/** Half up front, rounded up to the thousand, for two tiers, big orders and holidays. */
export function depositFor(items: OrderItem[], date?: string): Deposit {
  const total = orderTotal(items)
  const reasons: DepositReason[] = []
  if (items.some((item) => sizeOf(item.config).band === 'tiered')) reasons.push('tiered')
  if (total >= DEPOSIT_FROM) reasons.push('total')
  if (date && isHoliday(date)) reasons.push('holiday')
  const amount = reasons.length ? Math.ceil((total * DEPOSIT_SHARE) / 1000) * 1000 : 0
  return { amount, rest: total - amount, reasons }
}

// ---------------------------------------------------------------------------------------------------------
// Validation

/**
 * A Vietnamese mobile number in its usual 10-digit form, or null. Accepts +84, 0084 or 84 in front (with or
 * without the 0 people often keep after it, as in "+84 0347…") and any spacing.
 */
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/[\s.\-()]/g, '')
  if (digits.startsWith('+')) {
    if (!digits.startsWith('+84')) return null
    digits = digits.slice(3)
  } else if (digits.startsWith('0084')) digits = digits.slice(4)
  else if (digits.startsWith('84') && digits.length >= 11) digits = digits.slice(2)
  if (!digits.startsWith('0')) digits = `0${digits}`
  return /^0[35789]\d{8}$/.test(digits) ? digits : null
}

/** "0347 551 122", for receipts. */
export const formatPhone = (phone: string) => phone.replace(/^(\d{4})(\d{3})(\d{3})$/, '$1 $2 $3')

/** Field by field error codes; an empty object means the order can be placed. */
export function validateOrder(form: OrderForm, context: { now: Date; items: OrderItem[] }): OrderErrors {
  const errors: OrderErrors = {}
  const name = form.name.trim()
  if (!name) errors.name = 'required'
  else if (name.length < MIN_NAME_LENGTH) errors.name = 'tooShort'
  else if (name.length > MAX_NAME_LENGTH) errors.name = 'tooLong'

  if (!form.phone.trim()) errors.phone = 'required'
  else if (!normalizePhone(form.phone)) errors.phone = 'invalid'

  if (!METHODS.includes(form.method)) errors.method = 'required'

  const address = form.address.trim()
  if (form.method === 'delivery' && !address) errors.address = 'required'
  else if (address.length > MAX_ADDRESS_LENGTH) errors.address = 'tooLong'

  const { min, max } = dateRange(context.now)
  const slotContext = { ...context, method: form.method }
  if (!form.date) errors.date = 'required'
  else if (!isDate(form.date)) errors.date = 'invalid'
  else if (form.date > max) errors.date = 'tooFar'
  else if (form.date < min || !slotsFor(form.date, slotContext).length) errors.date = 'tooSoon'

  if (!form.time) errors.time = 'required'
  else if (!errors.date && !slotsFor(form.date, slotContext).includes(form.time)) errors.time = 'unavailable'

  if (!form.payment || !PAYMENTS.includes(form.payment)) errors.payment = 'required'
  else if (form.payment === 'cod' && depositFor(context.items, form.date).amount > 0)
    errors.payment = 'depositNeedsTransfer'

  if (form.note.length > MAX_NOTE_LENGTH) errors.note = 'tooLong'
  return errors
}

/** The form as it is kept once placed: trimmed, phone normalised. */
export function cleanForm(form: OrderForm): OrderForm {
  return {
    ...form,
    name: form.name.trim(),
    phone: normalizePhone(form.phone) ?? form.phone.trim(),
    address: form.method === 'delivery' ? form.address.trim() : '',
    note: form.note.trim(),
  }
}

// ---------------------------------------------------------------------------------------------------------
// The placed order

export interface Order {
  number: string
  form: OrderForm
  total: number
  deposit: Deposit
}

/** A short order reference such as "KAI-4821". Only for show while the shop is not real. */
export function orderNumber(): string {
  let n: number
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    n = crypto.getRandomValues(new Uint32Array(1))[0] % 10000
  } else {
    n = Math.floor(Math.random() * 10000)
  }
  return `KAI-${String(n).padStart(4, '0')}`
}

/** "Thứ Năm, 24 tháng 12" or "Thursday 24 December" for a shop date. */
export function formatDay(date: string, lang: Locale): string {
  if (!isDate(date)) return date
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(wallOf(date)))
}

/**
 * The order as plain text, to paste into Zalo when the shop takes real orders (ORDERING_OPEN). Each cake carries
 * a link that opens its exact design in the builder.
 */
export function orderText({
  order,
  items,
  dict,
  lang,
  origin,
}: {
  order: Order
  items: OrderItem[]
  dict: ClientDictionary
  lang: Locale
  origin: string
}): string {
  const t = dict.cart.orderText
  const { form, deposit } = order
  const money = (dong: number) => formatMoney(dong, lang)
  const lines = [
    t.title(order.number),
    `${t.name}: ${form.name}`,
    `${t.phone}: ${formatPhone(form.phone)}`,
    form.method === 'delivery' ? `${t.delivery}: ${form.address}` : t.pickup,
    `${t.when}: ${formatDay(form.date, lang)}, ${form.time}`,
    '',
  ]
  for (const item of items) {
    const preset = presetById(item.presetId)
    const name = preset ? dict.cake.presets[preset.id].name : dict.cake.yourDesign
    lines.push(`• ${name} × ${item.quantity}: ${money(priceOf(item.config) * item.quantity)}`)
    lines.push(`  ${describeCake(item.config, dict)}`)
    lines.push(`  ${t.link}: ${origin}${localeHref(lang, designPath(item.config))}`)
  }
  lines.push('', `${t.total}: ${money(order.total)}`)
  if (deposit.amount) lines.push(`${t.deposit}: ${money(deposit.amount)} · ${t.rest}: ${money(deposit.rest)}`)
  if (form.payment) lines.push(`${t.payment}: ${dict.cart.checkout.payment[form.payment]}`)
  if (form.note) lines.push(`${t.note}: ${form.note}`)
  return lines.join('\n')
}
