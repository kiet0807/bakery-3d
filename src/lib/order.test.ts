import { afterEach, describe, expect, it } from 'vitest'
import { dictionaries } from '@/i18n/dictionaries'
import { DEFAULT_CAKE, normalizeConfig } from './cake'
import {
  EMPTY_FORM,
  MAX_NOTE_LENGTH,
  SLOTS,
  addShopDays,
  cleanForm,
  dateChoices,
  dateRange,
  depositFor,
  earliestDate,
  formatDay,
  formatPhone,
  isHoliday,
  leadFor,
  normalizePhone,
  orderNumber,
  orderText,
  orderTotal,
  shopToday,
  slotsFor,
  TET_DAYS,
  validateOrder,
  type OrderForm,
  type OrderItem,
} from './order'
import { presetById } from './presets'
import { decodeCake } from './share'

/** An instant given as the shop's own clock (UTC+7, no daylight saving). */
const shopTime = (date: string, time: string) => new Date(`${date}T${time}:00+07:00`)

const preset = (id: string, quantity = 1): OrderItem => {
  const found = presetById(id)!
  return { config: found.config, presetId: found.id, quantity }
}
const MENU = [preset('strawberry-cloud')]
const CUSTOM: OrderItem[] = [{ config: DEFAULT_CAKE, quantity: 1 }]
const TIERED = [preset('caramel-crown')]

const originalTZ = process.env.TZ
afterEach(() => {
  process.env.TZ = originalTZ
})

describe("the shop's clock", () => {
  it('reads dates on the shop clock, whatever the visitor’s zone', () => {
    // 23:30 on 20 Nov in UTC is already 06:30 on 21 Nov in Ho Chi Minh City.
    const now = new Date('2026-11-20T23:30:00Z')
    process.env.TZ = 'America/Los_Angeles'
    expect(shopToday(now)).toBe('2026-11-21')
    process.env.TZ = 'Asia/Tokyo'
    expect(shopToday(now)).toBe('2026-11-21')
  })

  it('gives the same slots to a visitor abroad', () => {
    const now = shopTime('2026-11-21', '10:00')
    process.env.TZ = 'America/New_York'
    const abroad = slotsFor('2026-11-21', { now, method: 'pickup', items: MENU })
    process.env.TZ = 'Asia/Ho_Chi_Minh'
    const local = slotsFor('2026-11-21', { now, method: 'pickup', items: MENU })
    expect(abroad).toEqual(local)
    expect(abroad[0]).toBe('14:00')
  })

  it('adds days across month and year ends and keeps a 30-day window', () => {
    expect(addShopDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addShopDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(dateRange(shopTime('2026-11-21', '10:00'))).toEqual({ min: '2026-11-21', max: '2026-12-21' })
  })

  it('writes the day in words in each language', () => {
    expect(formatDay('2026-12-24', 'en')).toBe('Thursday 24 December')
    expect(formatDay('2026-12-24', 'vi')).toMatch(/Thứ Năm.*24/)
  })
})

describe('slots', () => {
  it('offers pickup every 30 minutes in opening hours and delivery while riders run', () => {
    // The counter opens at 6:30 and closes at 22:45: the last half-hour mark inside is 22:30.
    expect(SLOTS.pickup[0]).toBe('06:30')
    expect(SLOTS.pickup.at(-1)).toBe('22:30')
    expect(SLOTS.pickup).toHaveLength(33)
    expect(SLOTS.delivery[0]).toBe('08:00')
    expect(SLOTS.delivery.at(-1)).toBe('21:30')
  })

  it('needs 4 hours for a menu cake, the same day', () => {
    const now = shopTime('2026-11-21', '17:00')
    expect(slotsFor('2026-11-21', { now, method: 'pickup', items: MENU })).toEqual([
      '21:00',
      '21:30',
      '22:00',
      '22:30',
    ])
    expect(slotsFor('2026-11-21', { now, method: 'delivery', items: MENU })).toEqual(['21:00', '21:30'])
  })

  it('stops same-day menu orders at 18:00', () => {
    const now = shopTime('2026-11-21', '18:00')
    expect(slotsFor('2026-11-21', { now, method: 'pickup', items: MENU })).toEqual([])
    expect(earliestDate({ now, method: 'pickup', items: MENU })).toBe('2026-11-22')
    expect(slotsFor('2026-11-22', { now, method: 'pickup', items: MENU })[0]).toBe('06:30')
  })

  it('needs 24 hours for a designed cake and 48 for two tiers', () => {
    const now = shopTime('2026-11-21', '10:00')
    expect(leadFor(CUSTOM).hours).toBe(24)
    expect(slotsFor('2026-11-21', { now, method: 'pickup', items: CUSTOM })).toEqual([])
    expect(slotsFor('2026-11-22', { now, method: 'pickup', items: CUSTOM })[0]).toBe('10:00')
    expect(earliestDate({ now, method: 'pickup', items: [...MENU, ...TIERED] })).toBe('2026-11-23')
    expect(slotsFor('2026-11-23', { now, method: 'pickup', items: TIERED })[0]).toBe('10:00')
  })

  it('needs 48 hours on holidays, for every order', () => {
    const now = shopTime('2026-11-19', '10:00')
    expect(leadFor(MENU, '2026-11-20')).toEqual({ kind: 'menu', hours: 48, holiday: true })
    expect(slotsFor('2026-11-20', { now, method: 'pickup', items: MENU })).toEqual([])
    expect(earliestDate({ now, method: 'pickup', items: MENU })).toBe('2026-11-19')
    const evening = shopTime('2026-11-19', '19:00')
    expect(earliestDate({ now: evening, method: 'pickup', items: MENU })).toBe('2026-11-21')
  })

  it('counts the busy cake days of the year as holidays', () => {
    for (const day of ['01-01', '02-14', '03-08', '06-01', '10-20', '11-20', '12-24', '12-25'])
      expect(isHoliday(`2027-${day}`)).toBe(true)
    for (const day of ['01-02', '05-31', '06-02', '12-26']) expect(isHoliday(`2027-${day}`)).toBe(false)
  })

  it('treats the week before Tết and its first three days as holidays', () => {
    expect(isHoliday('2027-01-29')).toBe(false)
    expect(isHoliday('2027-01-30')).toBe(true)
    expect(isHoliday('2027-02-05')).toBe(true)
    for (const day of ['2027-02-06', '2027-02-07', '2027-02-08']) expect(isHoliday(day)).toBe(true)
    expect(isHoliday('2027-02-09')).toBe(false)
    expect(leadFor(MENU, '2027-02-01')).toEqual({ kind: 'menu', hours: 48, holiday: true })
    expect(depositFor(MENU, '2027-02-01').reasons).toEqual(['holiday'])
    // Listed in order, so a mistyped year stands out.
    expect([...TET_DAYS].sort()).toEqual([...TET_DAYS])
  })

  it('knows Tết by the Vietnamese calendar, years ahead', () => {
    // 2030: the new moon falls just before midnight at UTC+7, so Tết is a day before the Chinese New Year.
    expect(TET_DAYS).toContain('2030-02-02')
    expect(isHoliday('2030-02-01')).toBe(true)
    expect(isHoliday('2030-02-04')).toBe(true)
    expect(isHoliday('2030-02-05')).toBe(false)
    expect(isHoliday('2031-01-22')).toBe(true)
    expect(isHoliday('2032-02-10')).toBe(true)
  })

  it('offers the next days that still have a slot, skipping full ones', () => {
    // 19 November, 19:00: today is past the 18:00 cutoff and 20 November (a holiday) needs 48 hours.
    const evening = shopTime('2026-11-19', '19:00')
    expect(dateChoices({ now: evening, method: 'pickup', items: MENU }, 3)).toEqual([
      '2026-11-21',
      '2026-11-22',
      '2026-11-23',
    ])
    const morning = shopTime('2026-11-21', '10:00')
    expect(dateChoices({ now: morning, method: 'pickup', items: MENU }, 7)).toHaveLength(7)
    expect(dateChoices({ now: morning, method: 'pickup', items: CUSTOM }, 2)).toEqual([
      '2026-11-22',
      '2026-11-23',
    ])
    // Near the end of the window there are fewer days than asked for.
    expect(dateChoices({ now: morning, method: 'pickup', items: MENU }, 40)).toHaveLength(31)
  })

  it('has nothing outside the 30-day window', () => {
    const now = shopTime('2026-11-21', '10:00')
    expect(slotsFor('2026-12-22', { now, method: 'pickup', items: MENU })).toEqual([])
    expect(slotsFor('2026-11-20', { now, method: 'pickup', items: MENU })).toEqual([])
    expect(slotsFor('nope', { now, method: 'pickup', items: MENU })).toEqual([])
  })
})

describe('deposit', () => {
  it('takes half, rounded up to the thousand, from 1.000.000đ', () => {
    const items = [preset('strawberry-cloud', 2), preset('rainbow-birthday')]
    expect(orderTotal(items)).toBe(1_155_000)
    expect(depositFor(items)).toEqual({ amount: 578_000, rest: 577_000, reasons: ['total'] })
  })

  it('applies to two tiers and to holidays', () => {
    expect(depositFor(TIERED)).toMatchObject({ amount: 645_000, reasons: ['tiered', 'total'] })
    expect(depositFor(MENU, '2026-02-14')).toEqual({ amount: 175_000, rest: 175_000, reasons: ['holiday'] })
    expect(depositFor(MENU, '2026-02-15')).toEqual({ amount: 0, rest: 350_000, reasons: [] })
  })
})

describe('phone numbers', () => {
  it('accepts Vietnamese mobiles in their usual shapes', () => {
    for (const raw of [
      '0347551122',
      '0347 551 122',
      '0347.551.122',
      '+84 347 551 122',
      '+84 0347 551 122',
      '(+84) 347-551-122',
      '0084 347 551 122',
      '84347551122',
    ])
      expect(normalizePhone(raw)).toBe('0347551122')
    expect(normalizePhone('0912-345-678')).toBe('0912345678')
    expect(formatPhone('0347551122')).toBe('0347 551 122')
  })

  it('refuses landlines, short or long numbers and letters', () => {
    for (const raw of [
      '0247551122',
      '034755112',
      '03475511223',
      'không có',
      '',
      '+1 347 551 1222',
      '+44 7700 900123',
    ])
      expect(normalizePhone(raw)).toBeNull()
  })
})

describe('validateOrder', () => {
  const now = shopTime('2026-11-21', '10:00')
  const valid: OrderForm = {
    ...EMPTY_FORM,
    name: 'Linh',
    phone: '0347 551 122',
    date: '2026-11-22',
    time: '14:00',
    payment: 'cod',
  }
  const check = (form: Partial<OrderForm>, items = MENU) =>
    validateOrder({ ...valid, ...form }, { now, items })

  it('accepts a complete order', () => {
    expect(check({})).toEqual({})
    expect(check({ method: 'delivery', address: '12 Võ Văn Ngân', time: '21:30' })).toEqual({})
  })

  it('returns a code for every missing field', () => {
    expect(validateOrder(EMPTY_FORM, { now, items: MENU })).toEqual({
      name: 'required',
      phone: 'required',
      date: 'required',
      time: 'required',
      payment: 'required',
    })
  })

  it('checks names, phones, addresses and notes', () => {
    expect(check({ name: ' A ' }).name).toBe('tooShort')
    expect(check({ name: 'x'.repeat(61) }).name).toBe('tooLong')
    expect(check({ phone: '12345' }).phone).toBe('invalid')
    expect(check({ method: 'delivery', address: '   ' }).address).toBe('required')
    expect(check({ method: 'delivery', address: 'x'.repeat(201) }).address).toBe('tooLong')
    expect(check({ note: 'x'.repeat(MAX_NOTE_LENGTH + 1) }).note).toBe('tooLong')
  })

  it('checks the day and the time against the rules', () => {
    expect(check({ date: '22/11/2026' }).date).toBe('invalid')
    expect(check({ date: '2026-11-31' }).date).toBe('invalid')
    expect(check({ date: '2026-11-20' }).date).toBe('tooSoon')
    expect(check({ date: '2026-12-22' }).date).toBe('tooFar')
    expect(check({ date: '2026-11-21', time: '12:00' }).time).toBe('unavailable')
    expect(check({ date: '2026-11-21', time: '14:00' })).toEqual({})
    expect(check({ time: '06:00' }).time).toBe('unavailable')
    expect(check({ time: '06:30' })).toEqual({})
    expect(check({ method: 'delivery', address: 'x', time: '22:00' }).time).toBe('unavailable')
    expect(check({ date: '2026-11-21', time: '14:00' }, CUSTOM).date).toBe('tooSoon')
  })

  it('asks for transfer or MoMo when there is a deposit', () => {
    expect(check({}, TIERED).date).toBe('tooSoon')
    expect(check({ date: '2026-11-24' }, TIERED).payment).toBe('depositNeedsTransfer')
    expect(check({ date: '2026-11-24', payment: 'momo' }, TIERED)).toEqual({})
  })

  it('cleans the form once placed', () => {
    expect(cleanForm({ ...valid, name: '  Linh ', phone: '+84 347 551 122', address: 'x' })).toMatchObject({
      name: 'Linh',
      phone: '0347551122',
      address: '',
    })
  })
})

describe('orderNumber', () => {
  it('looks like KAI-0000', () => {
    for (let i = 0; i < 50; i++) expect(orderNumber()).toMatch(/^KAI-\d{4}$/)
  })
})

describe('orderText', () => {
  const items = [
    preset('strawberry-cloud', 2),
    { config: normalizeConfig({ message: 'Mẹ yêu' }), quantity: 1 },
  ]
  const order = {
    number: 'KAI-0042',
    form: cleanForm({
      ...EMPTY_FORM,
      name: 'Linh',
      phone: '0347551122',
      method: 'delivery' as const,
      address: '12 Võ Văn Ngân',
      date: '2026-11-22',
      time: '14:00',
      payment: 'transfer' as const,
      note: 'Ít ngọt',
    }),
    total: orderTotal(items),
    deposit: depositFor(items),
  }

  it('lists the order with a link to every design, in Vietnamese', () => {
    const text = orderText({ order, items, dict: dictionaries.vi, lang: 'vi', origin: 'https://kai.example' })
    expect(text).toContain("Kai's Bakery · Đơn KAI-0042")
    expect(text).toContain('SĐT: 0347 551 122')
    expect(text).toContain('Giao tới: 12 Võ Văn Ngân')
    expect(text).toContain('• Dâu Tây Mây Hồng × 2: 700.000đ')
    expect(text).toContain('Cọc 50%: 525.000đ · còn lại: 525.000đ')
    expect(text).toContain('Ghi chú: Ít ngọt')
    const links = [...text.matchAll(/https:\/\/kai\.example\/design#cake=([\w-]+)/g)]
    expect(links).toHaveLength(2)
    expect(decodeCake(links[1][1])?.message).toBe('Mẹ yêu')
  })

  it('uses English words and English links', () => {
    const text = orderText({ order, items, dict: dictionaries.en, lang: 'en', origin: 'https://kai.example' })
    expect(text).toContain('Order KAI-0042')
    expect(text).toContain('Strawberry Cloud × 2: 700,000 VND')
    expect(text).toContain('https://kai.example/en/design#cake=')
    expect(text).toContain('Payment: Bank transfer')
  })
})
