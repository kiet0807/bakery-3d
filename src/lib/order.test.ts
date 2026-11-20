import { describe, expect, it } from 'vitest'
import {
  MAX_NAME_LENGTH,
  MAX_NOTE_LENGTH,
  PICKUP_TIMES,
  addDays,
  formatPickupDay,
  localDate,
  orderNumber,
  pickupRange,
  validateOrder,
  type OrderForm,
} from './order'

// 20 November 2026, mid-afternoon local time.
const today = new Date(2026, 10, 20, 15, 30)
const valid: OrderForm = { name: 'Linh', date: '2026-11-21', time: '14:00', note: '' }

describe('dates', () => {
  it('formats local dates, not UTC ones', () => {
    expect(localDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(localDate(new Date(2026, 0, 5, 0, 1))).toBe('2026-01-05')
  })

  it('adds days across month and year ends', () => {
    expect(addDays(new Date(2026, 10, 30), 1)).toBe('2026-12-01')
    expect(addDays(new Date(2026, 11, 31), 1)).toBe('2027-01-01')
  })

  it('offers pickups from tomorrow to 30 days ahead', () => {
    expect(pickupRange(today)).toEqual({ min: '2026-11-21', max: '2026-12-20' })
  })

  it('writes the pickup day in words', () => {
    expect(formatPickupDay('2026-12-24')).toBe('Thursday 24 December')
  })
})

describe('validateOrder', () => {
  it('accepts a complete order', () => {
    expect(validateOrder(valid, today)).toEqual({})
  })

  it('needs a name of 2 to 60 characters after trimming', () => {
    expect(validateOrder({ ...valid, name: '   ' }, today).name).toBeDefined()
    expect(validateOrder({ ...valid, name: ' A ' }, today).name).toBeDefined()
    expect(validateOrder({ ...valid, name: ' An ' }, today).name).toBeUndefined()
    expect(validateOrder({ ...valid, name: 'x'.repeat(MAX_NAME_LENGTH) }, today).name).toBeUndefined()
    expect(validateOrder({ ...valid, name: 'x'.repeat(MAX_NAME_LENGTH + 1) }, today).name).toBeDefined()
  })

  it('takes pickups from tomorrow up to 30 days ahead', () => {
    expect(validateOrder({ ...valid, date: '' }, today).date).toBeDefined()
    expect(validateOrder({ ...valid, date: '2026-11-20' }, today).date).toBeDefined()
    expect(validateOrder({ ...valid, date: '2026-11-21' }, today).date).toBeUndefined()
    expect(validateOrder({ ...valid, date: '2026-12-20' }, today).date).toBeUndefined()
    expect(validateOrder({ ...valid, date: '2026-12-21' }, today).date).toBeDefined()
    expect(validateOrder({ ...valid, date: '21/11/2026' }, today).date).toBeDefined()
  })

  it('only takes the listed pickup times', () => {
    for (const time of PICKUP_TIMES) expect(validateOrder({ ...valid, time }, today).time).toBeUndefined()
    expect(validateOrder({ ...valid, time: '' }, today).time).toBeDefined()
    expect(validateOrder({ ...valid, time: '13:00' }, today).time).toBeDefined()
  })

  it('keeps the note optional and short', () => {
    expect(validateOrder({ ...valid, note: 'x'.repeat(MAX_NOTE_LENGTH) }, today).note).toBeUndefined()
    expect(validateOrder({ ...valid, note: 'x'.repeat(MAX_NOTE_LENGTH + 1) }, today).note).toBeDefined()
  })
})

describe('orderNumber', () => {
  it('looks like CC-0000', () => {
    for (let i = 0; i < 50; i++) expect(orderNumber()).toMatch(/^CC-\d{4}$/)
  })
})
