import { describe as group, expect, it } from 'vitest'
import {
  DEFAULT_CAKE,
  MAX_CANDLES,
  MAX_MESSAGE_LENGTH,
  MAX_TOPPINGS,
  SIZES,
  allergensOf,
  cleanMessage,
  configKey,
  normalizeConfig,
  priceLines,
  priceOf,
} from './cake'
import { PRESETS, presetPrice } from './presets'

group('priceOf', () => {
  it('adds the size and each surcharge for the size band', () => {
    const cake = normalizeConfig({
      size: 'tier2', // 950.000, two-tier band
      sponge: 'matcha', // 60.000
      filling: 'salted-caramel', // 60.000
      frosting: 'pistachio', // 80.000
      drip: 'caramel', // 60.000
      toppings: ['macarons', 'gold-leaf'], // 80.000 + 140.000
      candles: 3, // free
      message: 'Hi', // free
    })
    expect(priceOf(cake)).toBe(950_000 + 60_000 + 60_000 + 80_000 + 60_000 + 80_000 + 140_000)
  })

  it('charges small cakes the small surcharge', () => {
    const small = normalizeConfig({ size: 's14', toppings: ['strawberries'] })
    const large = normalizeConfig({ size: 's16', toppings: ['strawberries'] })
    expect(priceOf(small)).toBe(250_000 + 30_000)
    expect(priceOf(large)).toBe(300_000 + 50_000)
  })

  it('matches the sum of its receipt lines', () => {
    for (const preset of PRESETS) {
      const sum = priceLines(preset.config).reduce((total, line) => total + line.price, 0)
      expect(sum).toBe(priceOf(preset.config))
    }
  })

  it('prices the default cake and the house cakes as on the menu', () => {
    // 16 cm 300.000 + strawberries 50.000; jam, pink frosting and cream kisses are free
    expect(priceOf(DEFAULT_CAKE)).toBe(350_000)
    expect(Object.fromEntries(PRESETS.map((p) => [p.id, presetPrice(p)]))).toEqual({
      'strawberry-cloud': 350_000,
      'choco-crush': 520_000,
      'bestie-bento': 160_000,
      'taro-dream': 340_000,
      'caramel-crown': 1_290_000,
      'rainbow-birthday': 455_000,
    })
  })

  it('keeps every price in whole thousands of đồng', () => {
    for (const size of SIZES) expect(size.price % 1000).toBe(0)
    for (const preset of PRESETS) expect(presetPrice(preset) % 1000).toBe(0)
  })
})

group('allergensOf', () => {
  it('always lists egg, milk and gluten', () => {
    expect(allergensOf(DEFAULT_CAKE)).toEqual(['egg', 'milk', 'gluten'])
  })

  it('adds soy for chocolate and nuts for macarons and pistachio, once each', () => {
    const cake = normalizeConfig({
      sponge: 'chocolate',
      drip: 'dark-chocolate',
      frosting: 'pistachio',
      toppings: ['macarons'],
    })
    expect(allergensOf(cake)).toEqual(['egg', 'milk', 'gluten', 'soy', 'nuts'])
  })
})

group('normalizeConfig', () => {
  it('falls back to the default cake for nonsense', () => {
    expect(normalizeConfig(null)).toEqual(DEFAULT_CAKE)
    expect(normalizeConfig({ size: 'huge', sponge: 42, toppings: 'all', sweetness: 'max' })).toEqual(
      DEFAULT_CAKE,
    )
  })

  it('reads designs saved before the sizes moved to centimetres', () => {
    expect(normalizeConfig({ size: 'classic', sponge: 'ube', drip: 'berry' })).toMatchObject({
      size: DEFAULT_CAKE.size,
      sponge: DEFAULT_CAKE.sponge,
      drip: DEFAULT_CAKE.drip,
    })
  })

  it('keeps the sweetness', () => {
    expect(normalizeConfig({ sweetness: 'regular' }).sweetness).toBe('regular')
    expect(normalizeConfig({}).sweetness).toBe('less')
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

group('configKey', () => {
  it('ignores the order of toppings', () => {
    const a = normalizeConfig({ toppings: ['cherries', 'sprinkles'] })
    const b = normalizeConfig({ toppings: ['sprinkles', 'cherries'] })
    expect(configKey(a)).toBe(configKey(b))
  })

  it('tells sweetness apart', () => {
    expect(configKey(DEFAULT_CAKE)).not.toBe(configKey({ ...DEFAULT_CAKE, sweetness: 'regular' }))
  })
})

group('presets', () => {
  it('are valid designs with unique ids', () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length)
    for (const preset of PRESETS) expect(normalizeConfig(preset.config)).toEqual(preset.config)
  })
})
