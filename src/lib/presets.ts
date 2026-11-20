import { normalizeConfig, priceOf, type CakeConfig } from './cake'

export interface Preset {
  id: string
  name: string
  tagline: string
  config: CakeConfig
}

/** The six cakes in the vitrine. Each one is an ordinary design that can be opened in the builder. */
export const PRESETS: Preset[] = [
  {
    id: 'strawberry-cloud',
    name: 'Strawberry Cloud',
    tagline: 'Vanilla sponge, strawberry jam and a pink cloud of cream.',
    config: normalizeConfig({
      size: 'classic',
      sponge: 'vanilla',
      filling: 'strawberry-jam',
      frosting: 'strawberry-milk',
      drip: 'none',
      toppings: ['strawberries', 'cream-kisses'],
    }),
  },
  {
    id: 'midnight-ganache',
    name: 'Midnight Ganache',
    tagline: 'Dark cocoa on dark cocoa, finished with cherries.',
    config: normalizeConfig({
      size: 'classic',
      sponge: 'chocolate',
      filling: 'chocolate-ganache',
      frosting: 'cocoa',
      drip: 'dark-chocolate',
      toppings: ['chocolate-shards', 'cherries'],
    }),
  },
  {
    id: 'matcha-garden',
    name: 'Matcha Garden',
    tagline: 'Uji matcha, pistachio and a touch of gold.',
    config: normalizeConfig({
      size: 'mini',
      sponge: 'matcha',
      filling: 'vanilla-cream',
      frosting: 'pistachio',
      drip: 'white-chocolate',
      toppings: ['blueberries', 'gold-leaf'],
    }),
  },
  {
    id: 'ube-dream',
    name: 'Ube Dream',
    tagline: 'Purple yam sponge under a lavender sky.',
    config: normalizeConfig({
      size: 'mini',
      sponge: 'ube',
      filling: 'vanilla-cream',
      frosting: 'lavender',
      drip: 'white-chocolate',
      toppings: ['macarons', 'sprinkles'],
    }),
  },
  {
    id: 'caramel-crown',
    name: 'Caramel Crown',
    tagline: 'Two tiers of salted caramel, made for a celebration.',
    config: normalizeConfig({
      size: 'grand',
      sponge: 'vanilla',
      filling: 'salted-caramel',
      frosting: 'butter-yellow',
      drip: 'caramel',
      toppings: ['macarons', 'gold-leaf'],
    }),
  },
  {
    id: 'birthday-confetti',
    name: 'Birthday Confetti',
    tagline: 'Rainbow sprinkles, candles and your words on top.',
    config: normalizeConfig({
      size: 'classic',
      sponge: 'vanilla',
      filling: 'vanilla-cream',
      frosting: 'cloud-white',
      drip: 'berry',
      toppings: ['sprinkles', 'macarons'],
      candles: 5,
      message: 'Happy Birthday',
    }),
  },
]

export const presetById = (id: string | null | undefined) => PRESETS.find((preset) => preset.id === id)

export const presetPrice = (preset: Preset) => priceOf(preset.config)
