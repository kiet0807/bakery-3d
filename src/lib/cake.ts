/**
 * The cake model: every choice a customer can make, what it costs and how it looks.
 * Everything visual in the 3D scenes is derived from a CakeConfig, so this file is the single source of truth.
 * It holds no words: names and notes live in the dictionaries (`src/i18n/vi/cake.ts` and `src/i18n/en/cake.ts`), keyed by these ids.
 */

export type SizeId = 'bento' | 's14' | 's16' | 's18' | 's20' | 'tier2'
export type SpongeId = 'vanilla' | 'chocolate' | 'red-velvet' | 'matcha' | 'taro'
export type FillingId =
  'vanilla-cream' | 'strawberry-jam' | 'chocolate-ganache' | 'salted-caramel' | 'fresh-mango'
export type FrostingId =
  'cloud-white' | 'strawberry-milk' | 'pistachio' | 'cocoa' | 'taro-purple' | 'butter-yellow'
export type DripId = 'none' | 'dark-chocolate' | 'caramel' | 'strawberry' | 'white-chocolate'
export type ToppingId =
  | 'strawberries'
  | 'blueberries'
  | 'macarons'
  | 'cherries'
  | 'cream-kisses'
  | 'chocolate-shards'
  | 'sprinkles'
  | 'gold-leaf'
export type Sweetness = 'less' | 'regular'
export type Allergen = 'egg' | 'milk' | 'gluten' | 'soy' | 'nuts'

/** Surcharges depend on how big the cake is: small (10–14 cm), large (16–20 cm) or two tiers. */
export type Band = 'small' | 'large' | 'tiered'

export interface CakeConfig {
  size: SizeId
  sponge: SpongeId
  filling: FillingId
  frosting: FrostingId
  drip: DripId
  toppings: ToppingId[]
  sweetness: Sweetness
  candles: number
  message: string
}

/** Surcharge in whole đồng for each band. All zero means the choice is included. */
export type BandPrice = Record<Band, number>

export interface Choice<Id extends string> {
  id: Id
  price: BandPrice
  /** Main colour in sRGB hex, used by the 3D materials and by the swatches in the UI. */
  color: string
  /** Allergens this choice adds on top of the ones in every cake. */
  allergens?: Allergen[]
}

export interface Tier {
  radius: number
  height: number
}

export interface SizeChoice {
  id: SizeId
  band: Band
  /** Diameters in cm, bottom tier first. */
  cm: number[]
  serves: [number, number]
  /** Base price in đồng: vanilla sponge, cream filling, one frosting colour, lettering, candles, knife and plates. */
  price: number
  /** Main colour, for the swatch in the UI. */
  color: string
  /** Tiers from the bottom up, in scene units (1 unit = 20 cm of diameter, so radius = cm / 20). */
  tiers: Tier[]
}

export const MAX_TOPPINGS = 4
export const MAX_CANDLES = 9
export const MAX_MESSAGE_LENGTH = 22

/** Every cake has these, whatever is chosen. */
export const BASE_ALLERGENS: Allergen[] = ['egg', 'milk', 'gluten']

const FREE: BandPrice = { small: 0, large: 0, tiered: 0 }
const band = (small: number, large: number, tiered: number): BandPrice => ({ small, large, tiered })

const SPONGE = '#f3d9a4'

export const SIZES: SizeChoice[] = [
  {
    id: 'bento',
    band: 'small',
    cm: [10],
    serves: [1, 2],
    price: 150_000,
    color: SPONGE,
    tiers: [{ radius: 0.5, height: 0.62 }],
  },
  {
    id: 's14',
    band: 'small',
    cm: [14],
    serves: [2, 4],
    price: 250_000,
    color: SPONGE,
    tiers: [{ radius: 0.7, height: 0.76 }],
  },
  {
    id: 's16',
    band: 'large',
    cm: [16],
    serves: [4, 6],
    price: 300_000,
    color: SPONGE,
    tiers: [{ radius: 0.8, height: 0.84 }],
  },
  {
    id: 's18',
    band: 'large',
    cm: [18],
    serves: [6, 8],
    price: 370_000,
    color: SPONGE,
    tiers: [{ radius: 0.9, height: 0.9 }],
  },
  {
    id: 's20',
    band: 'large',
    cm: [20],
    serves: [8, 10],
    price: 440_000,
    color: SPONGE,
    tiers: [{ radius: 1, height: 0.95 }],
  },
  {
    id: 'tier2',
    band: 'tiered',
    cm: [20, 14],
    serves: [15, 20],
    price: 950_000,
    color: SPONGE,
    tiers: [
      { radius: 1, height: 0.82 },
      { radius: 0.7, height: 0.68 },
    ],
  },
]

export const SPONGES: Choice<SpongeId>[] = [
  { id: 'vanilla', price: FREE, color: '#f2d59b' },
  { id: 'chocolate', price: FREE, color: '#6b4232', allergens: ['soy'] },
  { id: 'red-velvet', price: band(20_000, 30_000, 60_000), color: '#a8323e' },
  { id: 'matcha', price: band(20_000, 30_000, 60_000), color: '#9fbf72' },
  { id: 'taro', price: band(20_000, 30_000, 60_000), color: '#a98bd0' },
]

export const FILLINGS: Choice<FillingId>[] = [
  { id: 'vanilla-cream', price: FREE, color: '#fff4de' },
  { id: 'strawberry-jam', price: FREE, color: '#d9405a' },
  {
    id: 'chocolate-ganache',
    price: band(20_000, 30_000, 60_000),
    color: '#4a2c22',
    allergens: ['soy'],
  },
  { id: 'salted-caramel', price: band(20_000, 30_000, 60_000), color: '#d38d43' },
  { id: 'fresh-mango', price: band(30_000, 50_000, 100_000), color: '#f4b52e' },
]

export const FROSTINGS: Choice<FrostingId>[] = [
  { id: 'cloud-white', price: FREE, color: '#fbf6ee' },
  { id: 'strawberry-milk', price: FREE, color: '#f6c1cf' },
  {
    id: 'pistachio',
    price: band(30_000, 40_000, 80_000),
    color: '#c8e0ad',
    allergens: ['nuts'],
  },
  { id: 'cocoa', price: FREE, color: '#8a5a44', allergens: ['soy'] },
  { id: 'taro-purple', price: FREE, color: '#d8caf1' },
  { id: 'butter-yellow', price: FREE, color: '#f8e19c' },
]

export const DRIPS: Choice<DripId>[] = [
  { id: 'none', price: FREE, color: '#ffffff' },
  { id: 'dark-chocolate', price: band(20_000, 30_000, 60_000), color: '#3e2420', allergens: ['soy'] },
  { id: 'caramel', price: band(20_000, 30_000, 60_000), color: '#c9813a' },
  { id: 'strawberry', price: band(20_000, 30_000, 60_000), color: '#c8244f' },
  { id: 'white-chocolate', price: band(20_000, 30_000, 60_000), color: '#f3eadb', allergens: ['soy'] },
]

export const TOPPINGS: Choice<ToppingId>[] = [
  { id: 'strawberries', price: band(30_000, 50_000, 100_000), color: '#e2334d' },
  { id: 'blueberries', price: band(40_000, 60_000, 120_000), color: '#3b4c9b' },
  { id: 'macarons', price: band(40_000, 40_000, 80_000), color: '#f5b3c4', allergens: ['nuts'] },
  { id: 'cherries', price: band(40_000, 60_000, 120_000), color: '#a90f2b' },
  { id: 'cream-kisses', price: FREE, color: '#fff7ea' },
  {
    id: 'chocolate-shards',
    price: band(20_000, 30_000, 60_000),
    color: '#3a2219',
    allergens: ['soy'],
  },
  { id: 'sprinkles', price: band(10_000, 15_000, 30_000), color: '#7cc6f2' },
  { id: 'gold-leaf', price: band(50_000, 70_000, 140_000), color: '#e2b84e' },
]

export const SWEETNESS: Sweetness[] = ['less', 'regular']

export const DEFAULT_CAKE: CakeConfig = {
  size: 's16',
  sponge: 'vanilla',
  filling: 'strawberry-jam',
  frosting: 'strawberry-milk',
  drip: 'none',
  toppings: ['strawberries', 'cream-kisses'],
  sweetness: 'less',
  candles: 0,
  message: '',
}

function byId<Id extends string, C extends { id: Id }>(list: C[], id: Id): C {
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

/** The surcharge band of a size. */
export const bandOf = (size: SizeId): Band => byId(SIZES, size).band

/**
 * Macarons are sold by the piece, so the topping's words, its price band and the 3D ring all use this one count:
 * four (40.000đ), eight on a two-tier cake (80.000đ).
 */
export const macaronCount = (size: SizeId): number => (bandOf(size) === 'tiered' ? 8 : 4)

/** What a choice adds to a cake of the given size, in đồng. */
export const surcharge = (choice: { price: BandPrice }, size: SizeId) => choice.price[bandOf(size)]

/** One receipt line. The UI turns `kind` and `id` into words with the dictionary. */
export type PriceLine =
  | { kind: 'size'; id: SizeId; price: number }
  | { kind: 'sponge'; id: SpongeId; price: number }
  | { kind: 'filling'; id: FillingId; price: number }
  | { kind: 'frosting'; id: FrostingId; price: number }
  | { kind: 'drip'; id: DripId; price: number }
  | { kind: 'topping'; id: ToppingId; price: number }

/** Each line of the receipt, for the price breakdown in the UI. Candles and lettering are free. */
export function priceLines(config: CakeConfig): PriceLine[] {
  const size = config.size
  const lines: PriceLine[] = [
    { kind: 'size', id: size, price: sizeOf(config).price },
    { kind: 'sponge', id: config.sponge, price: surcharge(spongeOf(config), size) },
    { kind: 'filling', id: config.filling, price: surcharge(fillingOf(config), size) },
    { kind: 'frosting', id: config.frosting, price: surcharge(frostingOf(config), size) },
  ]
  if (config.drip !== 'none')
    lines.push({ kind: 'drip', id: config.drip, price: surcharge(dripOf(config), size) })
  for (const id of config.toppings) lines.push({ kind: 'topping', id, price: surcharge(toppingOf(id), size) })
  return lines
}

/** Price of one cake in whole đồng. */
export function priceOf(config: CakeConfig): number {
  return priceLines(config).reduce((sum, line) => sum + line.price, 0)
}

/** Allergens in a cake, in a fixed order. */
export function allergensOf(config: CakeConfig): Allergen[] {
  const found = new Set<Allergen>(BASE_ALLERGENS)
  const chosen = [
    spongeOf(config),
    fillingOf(config),
    frostingOf(config),
    dripOf(config),
    ...config.toppings.map(toppingOf),
  ]
  for (const choice of chosen) for (const allergen of choice.allergens ?? []) found.add(allergen)
  const order: Allergen[] = ['egg', 'milk', 'gluten', 'soy', 'nuts']
  return order.filter((allergen) => found.has(allergen))
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

function pick<Id extends string>(list: readonly ({ id: Id } | Id)[], value: unknown, fallback: Id): Id {
  return list.some((choice) => (typeof choice === 'string' ? choice : choice.id) === value)
    ? (value as Id)
    : fallback
}

/**
 * Turns anything (a preset, a saved cart from an older version, a shared link) into a valid CakeConfig.
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
    sweetness: pick(SWEETNESS, raw.sweetness, DEFAULT_CAKE.sweetness),
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
    config.sweetness,
    config.candles,
    config.message,
  ].join('|')
}
