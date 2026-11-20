import { describe, expect, it } from 'vitest'
import { createRandom, hashString } from './random'

describe('createRandom', () => {
  it('repeats for the same seed and stays in [0, 1)', () => {
    const a = createRandom(42)
    const b = createRandom(42)
    const values = Array.from({ length: 1000 }, () => a())
    expect(values).toEqual(Array.from({ length: 1000 }, () => b()))
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...values)).toBeLessThan(1)
  })

  it('differs between seeds', () => {
    expect(createRandom(1)()).not.toBe(createRandom(2)())
  })
})

describe('hashString', () => {
  it('is stable and spreads similar strings', () => {
    expect(hashString('cake')).toBe(hashString('cake'))
    expect(hashString('cake')).not.toBe(hashString('cakf'))
  })
})
