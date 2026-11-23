import { normalizeConfig, priceOf, type CakeConfig } from './cake'

/** A house cake. Its name and tagline live in the dictionaries under `cake.presets[id]`. */
export interface Preset {
  id: PresetId
  config: CakeConfig
}

export type PresetId =
  'strawberry-cloud' | 'choco-crush' | 'bestie-bento' | 'taro-dream' | 'caramel-crown' | 'rainbow-birthday'

/** The six cakes in the vitrine. Each one is an ordinary design that can be opened in the builder. */
export const PRESETS: Preset[] = [
  {
    id: 'strawberry-cloud',
    config: normalizeConfig({
      size: 's16',
      sponge: 'vanilla',
      filling: 'strawberry-jam',
      frosting: 'strawberry-milk',
      drip: 'none',
      toppings: ['strawberries', 'cream-kisses'],
    }),
  },
  {
    id: 'choco-crush',
    config: normalizeConfig({
      size: 's18',
      sponge: 'chocolate',
      filling: 'chocolate-ganache',
      frosting: 'cocoa',
      drip: 'dark-chocolate',
      toppings: ['chocolate-shards', 'cherries'],
    }),
  },
  {
    id: 'bestie-bento',
    config: normalizeConfig({
      size: 'bento',
      sponge: 'vanilla',
      filling: 'vanilla-cream',
      frosting: 'cloud-white',
      drip: 'none',
      toppings: ['sprinkles'],
      message: 'HPBD bestie',
    }),
  },
  {
    id: 'taro-dream',
    config: normalizeConfig({
      size: 's14',
      sponge: 'taro',
      filling: 'vanilla-cream',
      frosting: 'taro-purple',
      drip: 'white-chocolate',
      toppings: ['macarons', 'sprinkles'],
    }),
  },
  {
    id: 'caramel-crown',
    config: normalizeConfig({
      size: 'tier2',
      sponge: 'vanilla',
      filling: 'salted-caramel',
      frosting: 'butter-yellow',
      drip: 'caramel',
      toppings: ['macarons', 'gold-leaf'],
    }),
  },
  {
    id: 'rainbow-birthday',
    config: normalizeConfig({
      size: 's18',
      sponge: 'vanilla',
      filling: 'vanilla-cream',
      frosting: 'cloud-white',
      drip: 'strawberry',
      toppings: ['sprinkles', 'macarons'],
      candles: 5,
      message: 'Happy Birthday',
    }),
  },
]

export const presetById = (id: string | null | undefined) => PRESETS.find((preset) => preset.id === id)

export const presetPrice = (preset: Preset) => priceOf(preset.config)

/** The cake's picture on a see-through background, taken from the 3D scene by `scripts/preset-shots.mjs`. */
export const presetPicture = (id: PresetId) => `/cakes/${id}.webp`
