/**
 * The cake model: every choice a customer can make, what it costs and how it looks.
 * Everything visual in the 3D scenes is derived from a CakeConfig, so this file is the single source of truth.
 */

export type SizeId = 'mini' | 'classic' | 'grand'
export type SpongeId = 'vanilla' | 'chocolate' | 'red-velvet' | 'matcha' | 'ube'
export type FillingId =
  'vanilla-cream' | 'strawberry-jam' | 'chocolate-ganache' | 'salted-caramel' | 'mango-curd'
export type FrostingId =
  'cloud-white' | 'strawberry-milk' | 'pistachio' | 'cocoa' | 'lavender' | 'butter-yellow'
export type DripId = 'none' | 'dark-chocolate' | 'caramel' | 'berry' | 'white-chocolate'
export type ToppingId =
  | 'strawberries'
  | 'blueberries'
  | 'macarons'
  | 'cherries'
  | 'cream-kisses'
  | 'chocolate-shards'
  | 'sprinkles'
  | 'gold-leaf'

export interface CakeConfig {
  size: SizeId
  sponge: SpongeId
  filling: FillingId
  frosting: FrostingId
  drip: DripId
  toppings: ToppingId[]
  candles: number
  message: string
}

export interface Choice<Id extends string> {
  id: Id
  name: string
  note: string
  /** Extra price in whole US dollars. */
  price: number
  /** Main colour in sRGB hex, used by the 3D materials and by the swatches in the UI. */
  color: string
}

export interface Tier {
  radius: number
  height: number
}

export interface SizeChoice extends Choice<SizeId> {
  serves: string
  /** Tiers from the bottom up, in scene units (1 unit ≈ 10 cm). */
  tiers: Tier[]
}

export const MAX_TOPPINGS = 4
export const MAX_CANDLES = 9
export const MAX_MESSAGE_LENGTH = 22
export const CANDLE_PRICE = 1
export const MESSAGE_PRICE = 3

export const SIZES: SizeChoice[] = [
  {
    id: 'mini',
    name: 'Mini',
    note: 'One small tier',
    serves: '4–6',
    price: 28,
    color: '#f3d9a4',
    tiers: [{ radius: 0.72, height: 0.78 }],
  },
  {
    id: 'classic',
    name: 'Classic',
    note: 'One tall tier',
    serves: '10–12',
    price: 42,
    color: '#f3d9a4',
    tiers: [{ radius: 1, height: 0.95 }],
  },
  {
    id: 'grand',
    name: 'Grand',
    note: 'Two tiers',
    serves: '20–25',
    price: 78,
    color: '#f3d9a4',
    tiers: [
      { radius: 1.08, height: 0.82 },
      { radius: 0.7, height: 0.68 },
    ],
  },
]

export const SPONGES: Choice<SpongeId>[] = [
  { id: 'vanilla', name: 'Vanilla bean', note: 'Light, buttery, classic', price: 0, color: '#f2d59b' },
  { id: 'chocolate', name: 'Dark cocoa', note: 'Deep and moist', price: 3, color: '#6b4232' },
  { id: 'red-velvet', name: 'Red velvet', note: 'Soft cocoa with a tang', price: 4, color: '#a8323e' },
  { id: 'matcha', name: 'Uji matcha', note: 'Grassy, gently bitter', price: 5, color: '#9fbf72' },
  { id: 'ube', name: 'Ube', note: 'Purple yam, nutty and sweet', price: 5, color: '#9b7bcb' },
]

export const FILLINGS: Choice<FillingId>[] = [
  { id: 'vanilla-cream', name: 'Vanilla cream', note: 'Whipped, not too sweet', price: 0, color: '#fff4de' },
  {
    id: 'strawberry-jam',
    name: 'Strawberry jam',
    note: 'Made with whole berries',
    price: 2,
    color: '#d9405a',
  },
  {
    id: 'chocolate-ganache',
    name: 'Chocolate ganache',
    note: '70% dark chocolate',
    price: 3,
    color: '#4a2c22',
  },
  {
    id: 'salted-caramel',
    name: 'Salted caramel',
    note: 'Burnt sugar and sea salt',
    price: 3,
    color: '#d38d43',
  },
  { id: 'mango-curd', name: 'Mango curd', note: 'Bright and tropical', price: 3, color: '#f4b52e' },
]

export const FROSTINGS: Choice<FrostingId>[] = [
  { id: 'cloud-white', name: 'Cloud white', note: 'Swiss meringue buttercream', price: 0, color: '#fbf6ee' },
  {
    id: 'strawberry-milk',
    name: 'Strawberry milk',
    note: 'Freeze-dried berries',
    price: 0,
    color: '#f6c1cf',
  },
  { id: 'pistachio', name: 'Pistachio', note: 'Roasted Sicilian pistachio', price: 2, color: '#c8e0ad' },
  { id: 'cocoa', name: 'Cocoa', note: 'Milk chocolate buttercream', price: 0, color: '#8a5a44' },
  { id: 'lavender', name: 'Lavender', note: 'A hint of honey', price: 0, color: '#d8caf1' },
  { id: 'butter-yellow', name: 'Butter yellow', note: 'Lemon zest', price: 0, color: '#f8e19c' },
]

export const DRIPS: Choice<DripId>[] = [
  { id: 'none', name: 'No drip', note: 'Clean edges', price: 0, color: '#ffffff' },
  { id: 'dark-chocolate', name: 'Dark chocolate', note: 'Glossy ganache', price: 4, color: '#3e2420' },
  { id: 'caramel', name: 'Caramel', note: 'Slow-cooked', price: 4, color: '#c9813a' },
  { id: 'berry', name: 'Berry glaze', note: 'Raspberry and cassis', price: 4, color: '#b8174f' },
  { id: 'white-chocolate', name: 'White chocolate', note: 'Silky and sweet', price: 4, color: '#f3eadb' },
]

export const TOPPINGS: Choice<ToppingId>[] = [
  { id: 'strawberries', name: 'Strawberries', note: 'Fresh, hand-picked', price: 6, color: '#e2334d' },
  { id: 'blueberries', name: 'Blueberries', note: 'Little clusters', price: 5, color: '#3b4c9b' },
  { id: 'macarons', name: 'Macarons', note: 'Four pastel shells', price: 8, color: '#f5b3c4' },
  { id: 'cherries', name: 'Cherries', note: 'With their stems', price: 5, color: '#a90f2b' },
  { id: 'cream-kisses', name: 'Cream kisses', note: 'Piped all around', price: 3, color: '#fff7ea' },
  {
    id: 'chocolate-shards',
    name: 'Chocolate shards',
    note: 'Snapped dark chocolate',
    price: 4,
    color: '#3a2219',
  },
  { id: 'sprinkles', name: 'Sprinkles', note: 'A rainbow of them', price: 2, color: '#7cc6f2' },
  { id: 'gold-leaf', name: 'Gold leaf', note: 'Edible, 24 carat', price: 9, color: '#e2b84e' },
]

export const DEFAULT_CAKE: CakeConfig = {
  size: 'classic',
  sponge: 'vanilla',
  filling: 'strawberry-jam',
  frosting: 'strawberry-milk',
  drip: 'none',
  toppings: ['strawberries', 'cream-kisses'],
  candles: 0,
  message: '',
}

function byId<Id extends string, C extends Choice<Id>>(list: C[], id: Id): C {
  const found = list.find((choice) => choice.id === id)
  if (!found) throw new Error(`Unknown choice: ${id}`)
  return found
}

export const sizeOf = (config: CakeConfig) => byId(SIZES, config.size)
export const spongeOf = (config: CakeConfig) => byId(SPONGES, config.sponge)
export const fillingOf = (config: CakeConfig) => byId(FILLINGS, config.filling)
export const frostingOf = (config: CakeConfig) => byId(FROSTINGS, config.frosting)
export const dripOf = (config: CakeConfig) => byId(DRIPS, config.drip)
export const toppingOf = (id: ToppingId) => byId(TOPPINGS, id)

/** Price of one cake in whole US dollars. */
export function priceOf(config: CakeConfig): number {
  return (
    sizeOf(config).price +
    spongeOf(config).price +
    fillingOf(config).price +
    frostingOf(config).price +
    dripOf(config).price +
    config.toppings.reduce((sum, id) => sum + toppingOf(id).price, 0) +
    config.candles * CANDLE_PRICE +
    (config.message ? MESSAGE_PRICE : 0)
  )
}

/** Each line of the receipt, for the price breakdown in the UI. */
export function priceLines(config: CakeConfig): { label: string; price: number }[] {
  const lines = [
    { label: `${sizeOf(config).name} size`, price: sizeOf(config).price },
    { label: `${spongeOf(config).name} sponge`, price: spongeOf(config).price },
    { label: `${fillingOf(config).name} filling`, price: fillingOf(config).price },
    { label: `${frostingOf(config).name} frosting`, price: frostingOf(config).price },
  ]
  if (config.drip !== 'none')
    lines.push({ label: `${dripOf(config).name} drip`, price: dripOf(config).price })
  for (const id of config.toppings) lines.push({ label: toppingOf(id).name, price: toppingOf(id).price })
  if (config.candles > 0)
    lines.push({
      label: `${config.candles} candle${config.candles > 1 ? 's' : ''}`,
      price: config.candles * CANDLE_PRICE,
    })
  if (config.message) lines.push({ label: 'Message', price: MESSAGE_PRICE })
  return lines
}

/** One-line description, e.g. for the cart. */
export function describe(config: CakeConfig): string {
  const parts = [
    `${sizeOf(config).name}`,
    `${spongeOf(config).name} sponge`,
    `${fillingOf(config).name}`,
    `${frostingOf(config).name} frosting`,
  ]
  if (config.drip !== 'none') parts.push(`${dripOf(config).name} drip`)
  if (config.toppings.length) parts.push(config.toppings.map((id) => toppingOf(id).name).join(', '))
  if (config.candles) parts.push(`${config.candles} candle${config.candles > 1 ? 's' : ''}`)
  if (config.message) parts.push(`“${config.message}”`)
  return parts.join(' · ')
}

/** Letters (any script, so Vietnamese works), digits, spaces and a little punctuation. */
const MESSAGE_CHARACTERS = /[^\p{L}\p{M}\p{N} .,!?'&+-]/gu

export function cleanMessage(raw: string): string {
  return raw
    .normalize('NFC')
    .replace(MESSAGE_CHARACTERS, '')
    .replace(/\s+/g, ' ')
    .trimStart()
    .slice(0, MAX_MESSAGE_LENGTH)
}

function pick<Id extends string>(list: Choice<Id>[], value: unknown, fallback: Id): Id {
  return list.some((choice) => choice.id === value) ? (value as Id) : fallback
}

/**
 * Turns anything (a preset, a saved cart from an older version, a URL) into a valid CakeConfig.
 * Unknown values fall back to the default cake, toppings are de-duplicated and capped.
 */
export function normalizeConfig(input: unknown): CakeConfig {
  const raw = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>
  const toppings = Array.isArray(raw.toppings)
    ? [...new Set(raw.toppings.filter((id): id is ToppingId => TOPPINGS.some((t) => t.id === id)))].slice(
        0,
        MAX_TOPPINGS,
      )
    : DEFAULT_CAKE.toppings
  const candles = Number.isFinite(raw.candles) ? Math.round(Number(raw.candles)) : 0
  return {
    size: pick(SIZES, raw.size, DEFAULT_CAKE.size),
    sponge: pick(SPONGES, raw.sponge, DEFAULT_CAKE.sponge),
    filling: pick(FILLINGS, raw.filling, DEFAULT_CAKE.filling),
    frosting: pick(FROSTINGS, raw.frosting, DEFAULT_CAKE.frosting),
    drip: pick(DRIPS, raw.drip, DEFAULT_CAKE.drip),
    toppings,
    candles: Math.min(MAX_CANDLES, Math.max(0, candles)),
    message: typeof raw.message === 'string' ? cleanMessage(raw.message).trim() : '',
  }
}

/** A stable key for a design: same choices, same key. Used as the layout seed and to merge cart lines. */
export function configKey(config: CakeConfig): string {
  return [
    config.size,
    config.sponge,
    config.filling,
    config.frosting,
    config.drip,
    [...config.toppings].sort().join('+'),
    config.candles,
    config.message,
  ].join('|')
}
