import { allergensOf, priceLines, type CakeConfig, type PriceLine } from '@/lib/cake'
import { presetById } from '@/lib/presets'
import type { Dictionary } from './dictionaries'

/** The name of a choice on a receipt line, e.g. "16 cm" or "Mứt dâu". */
export function lineName(line: PriceLine, dict: Dictionary): string {
  const c = dict.cake
  switch (line.kind) {
    case 'size':
      return c.sizes[line.id].name
    case 'sponge':
      return c.sponges[line.id].name
    case 'filling':
      return c.fillings[line.id].name
    case 'frosting':
      return c.frostings[line.id].name
    case 'drip':
      return c.drips[line.id].name
    case 'topping':
      return c.toppings[line.id].name
  }
}

/** "Cốt bánh: Vani", for a receipt. */
export const lineLabel = (line: PriceLine, dict: Dictionary) =>
  `${dict.cake.kinds[line.kind]}: ${lineName(line, dict)}`

/** One line describing a cake, e.g. for the cart: "16 cm · Vani · Mứt dâu · Hồng dâu · Dâu tây Đà Lạt · Ít ngọt". */
export function describeCake(config: CakeConfig, dict: Dictionary): string {
  const parts = priceLines(config).map((line) => lineName(line, dict))
  parts.push(dict.cake.sweetness[config.sweetness].name)
  if (config.candles) parts.push(dict.cake.candles(config.candles))
  if (config.message) parts.push(dict.cake.quoted(config.message))
  return parts.join(' · ')
}

/** The name to show for a cake: the house cake's name, or "your own design". */
export function cakeName(presetId: string | undefined, dict: Dictionary): string {
  const preset = presetById(presetId)
  return preset ? dict.cake.presets[preset.id].name : dict.cake.yourDesign
}

/** "Có chứa: trứng, sữa, bột mì (gluten)". */
export function allergenText(config: CakeConfig, dict: Dictionary): string {
  return `${dict.common.contains}: ${allergensOf(config)
    .map((allergen) => dict.common.allergens[allergen])
    .join(', ')}`
}
