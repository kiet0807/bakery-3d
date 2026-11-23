import { describe, expect, it } from 'vitest'
import { macaronCount, normalizeConfig } from '@/lib/cake'
import { PRESETS } from '@/lib/presets'
import { PLAQUE_HEIGHT, computeLayout, headroom, plaqueLines } from './layout'

const bento = normalizeConfig({ size: 'bento', candles: 9, message: 'Chúc mừng sinh nhật Mẹ' })

describe('plaqueLines', () => {
  it('breaks a long message at the space nearest the middle', () => {
    expect(plaqueLines('Chúc mừng sinh nhật Mẹ', 0.52, 0.18, 0.056)).toBe('Chúc mừng\nsinh nhật Mẹ')
  })

  it('keeps a message on one line when it fits', () => {
    expect(plaqueLines('Happy Birthday Linh', 0.83, 0.23, 0.072)).toBe('Happy Birthday Linh')
    expect(plaqueLines('HPBD bestie', 0.52, 0.18, 0.056)).toBe('HPBD bestie')
  })

  it('leaves a single word alone', () => {
    expect(plaqueLines('Supercalifragilistic', 0.3, 0.2, 0.07)).toBe('Supercalifragilistic')
  })
})

describe('plaque and headroom', () => {
  it('lifts the plaque above the flame tips on a small cake full of candles', () => {
    const layout = computeLayout(bento)
    const candle = layout.candles[0]
    const flameTip = candle.y + 0.385 * candle.scale
    expect(layout.plaque).not.toBeNull()
    expect(layout.topY + 0.03 + layout.plaque!.lift).toBeGreaterThanOrEqual(flameTip - 1e-9)
  })

  it('keeps the plaque low when there are no candles, and above the flames on every size when there are', () => {
    expect(computeLayout(normalizeConfig({ size: 'bento', message: 'Hi' })).plaque!.lift).toBe(0)
    expect(computeLayout(normalizeConfig({ size: 's18', message: 'Hi' })).plaque!.lift).toBe(0)
    for (const size of ['s14', 's16', 's18', 's20', 'tier2'] as const)
      expect(
        computeLayout(normalizeConfig({ size, candles: 5, message: 'Hi' })).plaque!.lift,
      ).toBeGreaterThan(0.2)
  })

  it('leaves room for the whole plaque, so a box lid or a cloche never cuts through it', () => {
    const { plaque } = computeLayout(bento)
    expect(headroom(bento)).toBeGreaterThan(0.03 + plaque!.lift + PLAQUE_HEIGHT * plaque!.scale)
    expect(headroom(normalizeConfig({ size: 's16', message: 'Hi' }))).toBeCloseTo(0.42)
    expect(headroom(normalizeConfig({ size: 's16', candles: 3 }))).toBe(0.4)
    expect(headroom(normalizeConfig({ size: 's16' }))).toBe(0.22)
  })
})

describe('the topping ring', () => {
  const ringOf = (config: Parameters<typeof normalizeConfig>[0]) =>
    computeLayout(normalizeConfig(config)).ring

  it('draws exactly the macarons the topping promises, on every vitrine cake that has them', () => {
    const withMacarons = PRESETS.filter((preset) => preset.config.toppings.includes('macarons'))
    expect(withMacarons.length).toBeGreaterThan(0)
    for (const preset of withMacarons)
      expect(computeLayout(preset.config).ring.macarons, preset.id).toHaveLength(
        macaronCount(preset.config.size),
      )
  })

  it('draws eight on a two-tier cake, and lets fruit fill the rest of the ring', () => {
    expect(ringOf({ size: 'tier2', toppings: ['macarons'] }).macarons).toHaveLength(8)
    const mixed = ringOf({ size: 's18', toppings: ['strawberries', 'macarons'] })
    expect(mixed.macarons).toHaveLength(4)
    expect(mixed.strawberries.length).toBeGreaterThan(4)
  })
})

describe('what stays put when the design changes', () => {
  const base = { size: 's18', toppings: ['sprinkles', 'macarons'], drip: 'none' } as const
  const layoutOf = (config: Parameters<typeof normalizeConfig>[0]) => computeLayout(normalizeConfig(config))

  it('keeps every sprinkle and macaron where it was when only colours change', () => {
    const before = layoutOf(base)
    const after = layoutOf({ ...base, frosting: 'cocoa', drip: 'caramel', sponge: 'matcha' })
    expect(after.sprinkles).toEqual(before.sprinkles)
    expect(after.ring.macarons.map((p) => [p.x, p.z])).toEqual(before.ring.macarons.map((p) => [p.x, p.z]))
  })

  it('leaves the sprinkles alone when another topping is added, and the macarons standing where they were', () => {
    const before = layoutOf(base)
    const after = layoutOf({ ...base, toppings: ['sprinkles', 'macarons', 'strawberries'] })
    expect(after.sprinkles).toEqual(before.sprinkles)
    expect(after.ring.macarons.map((p) => [p.x, p.z])).toEqual(before.ring.macarons.map((p) => [p.x, p.z]))
  })

  it('tells each drip which tier it runs down', () => {
    const { drips, tiers } = layoutOf({ size: 'tier2', drip: 'caramel' })
    for (const [index, tier] of tiers.entries()) {
      const own = drips.filter((d) => d.tier === index)
      expect(own.length).toBeGreaterThan(0)
      // Drips start just under the tier's rounded top edge.
      for (const d of own) expect(Math.abs(d.top - (tier.base + tier.height))).toBeLessThan(0.08)
    }
  })
})
