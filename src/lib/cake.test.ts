import { describe as group, expect, it } from 'vitest'
import {
  DEFAULT_CAKE,
  MAX_CANDLES,
  MAX_MESSAGE_LENGTH,
  MAX_TOPPINGS,
  cleanMessage,
  configKey,
  describe,
  normalizeConfig,
  priceLines,
  priceOf,
} from './cake'
import { PRESETS } from './presets'

group('priceOf', () => {
  it('adds size, flavours, toppings, candles and message', () => {
    const cake = normalizeConfig({
      size: 'grand', // 78
      sponge: 'matcha', // 5
      filling: 'salted-caramel', // 3
      frosting: 'pistachio', // 2
      drip: 'caramel', // 4
      toppings: ['macarons', 'gold-leaf'], // 8 + 9
      candles: 3, // 3
      message: 'Hi', // 3
    })
    expect(priceOf(cake)).toBe(78 + 5 + 3 + 2 + 4 + 8 + 9 + 3 + 3)
  })

  it('matches the sum of its receipt lines', () => {
    for (const preset of PRESETS) {
      const sum = priceLines(preset.config).reduce((total, line) => total + line.price, 0)
      expect(sum).toBe(priceOf(preset.config))
    }
  })

  it('prices the default cake', () => {
    // classic 42 + vanilla 0 + strawberry jam 2 + strawberry milk 0 + strawberries 6 + cream kisses 3
    expect(priceOf(DEFAULT_CAKE)).toBe(53)
  })
})

group('normalizeConfig', () => {
  it('falls back to the default cake for nonsense', () => {
    expect(normalizeConfig(null)).toEqual(DEFAULT_CAKE)
    expect(normalizeConfig({ size: 'huge', sponge: 42, toppings: 'all' })).toEqual(DEFAULT_CAKE)
  })

  it('removes unknown and repeated toppings and keeps at most four', () => {
    const cake = normalizeConfig({
      toppings: ['sprinkles', 'sprinkles', 'unicorns', 'cherries', 'macarons', 'gold-leaf', 'blueberries'],
    })
    expect(cake.toppings).toEqual(['sprinkles', 'cherries', 'macarons', 'gold-leaf'])
    expect(cake.toppings.length).toBe(MAX_TOPPINGS)
  })

  it('keeps candles between 0 and the maximum', () => {
    expect(normalizeConfig({ candles: -4 }).candles).toBe(0)
    expect(normalizeConfig({ candles: 99 }).candles).toBe(MAX_CANDLES)
    expect(normalizeConfig({ candles: 2.6 }).candles).toBe(3)
    expect(normalizeConfig({ candles: 'five' }).candles).toBe(0)
  })

  it('cleans the message', () => {
    expect(normalizeConfig({ message: '  Happy <b>30th</b>!  ' }).message).toBe('Happy b30thb!')
    expect(normalizeConfig({ message: 'x'.repeat(50) }).message.length).toBe(MAX_MESSAGE_LENGTH)
  })
})

group('cleanMessage', () => {
  it('keeps Vietnamese letters and composes them', () => {
    expect(cleanMessage('Chúc mừng sinh nhật'.normalize('NFD'))).toBe('Chúc mừng sinh nhật')
    expect(cleanMessage('Mẹ yêu')).toBe('Mẹ yêu')
  })

  it('keeps spaces while typing but collapses runs of them', () => {
    expect(cleanMessage('Happy   ')).toBe('Happy ')
    expect(cleanMessage('   Hi')).toBe('Hi')
  })

  it('drops symbols that the cake font cannot draw', () => {
    expect(cleanMessage('I ♥ you 🎂')).toBe('I you ')
  })
})

group('configKey and describe', () => {
  it('ignores the order of toppings', () => {
    const a = normalizeConfig({ toppings: ['cherries', 'sprinkles'] })
    const b = normalizeConfig({ toppings: ['sprinkles', 'cherries'] })
    expect(configKey(a)).toBe(configKey(b))
  })

  it('describes a cake in one line', () => {
    expect(describe(DEFAULT_CAKE)).toBe(
      'Classic · Vanilla bean sponge · Strawberry jam · Strawberry milk frosting · Strawberries, Cream kisses',
    )
  })
})

group('presets', () => {
  it('are valid designs with unique ids', () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length)
    for (const preset of PRESETS) expect(normalizeConfig(preset.config)).toEqual(preset.config)
  })
})
