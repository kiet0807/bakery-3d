import { configKey, sizeOf, type CakeConfig, type ToppingId } from '@/lib/cake'
import { createRandom, hashString } from '@/lib/random'
import { BEVEL, FROSTING, SLICE_ANGLE } from './geometry'

export type Part = 'body' | 'slice'

export interface TierLayout {
  radius: number
  height: number
  /** Height of the tier's bottom above the plate. */
  base: number
}

export interface Placement {
  x: number
  y: number
  z: number
  /** Rotation around Y. */
  yaw: number
  /** Lean away from the centre (radians), for shards and macarons. */
  tilt: number
  scale: number
  part: Part
  variant: number
}

export interface Drip {
  x: number
  z: number
  top: number
  length: number
  part: Part
}

export interface CakeLayout {
  seed: number
  tiers: TierLayout[]
  top: TierLayout
  topY: number
  totalHeight: number
  maxRadius: number
  drips: Drip[]
  ring: Record<Exclude<ToppingId, 'sprinkles' | 'gold-leaf'>, Placement[]>
  sprinkles: Placement[]
  goldLeaf: Placement[]
  candles: Placement[]
  /**
   * `scale` shrinks the plaque and its lettering on small cakes; `lift` raises it on longer sticks, like a cake
   * topper, so the words clear the candles on a small top.
   */
  plaque: { y: number; z: number; width: number; scale: number; lift: number } | null
}

const RING_TOPPINGS = [
  'strawberries',
  'blueberries',
  'macarons',
  'cherries',
  'chocolate-shards',
] as const satisfies readonly ToppingId[]

/** Which piece of the cake a point at this angle belongs to once the slice is cut. */
export function partAt(angle: number): Part {
  const a = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  const half = SLICE_ANGLE / 2
  return a < half || a > Math.PI * 2 - half ? 'slice' : 'body'
}

/** Converts polar coordinates on the cake (three.js convention: angle 0 faces +Z). */
const polar = (radius: number, angle: number) => ({
  x: Math.sin(angle) * radius,
  z: Math.cos(angle) * radius,
})

export interface LayoutOptions {
  /** Fewer sprinkles and drips, for the vitrine where six cakes are on screen. */
  light?: boolean
}

/** Toppings shrink a little on small cakes (a 10 cm bento), so they keep their proportions. */
const toppingScale = (radius: number) => Math.min(1, Math.max(0.72, radius / 0.85))

export function computeLayout(config: CakeConfig, { light = false }: LayoutOptions = {}): CakeLayout {
  // Sweetness does not show on the cake, so changing it must not reshuffle the sprinkles.
  const seed = hashString(configKey({ ...config, sweetness: 'less' }))
  const random = createRandom(seed)
  let base = 0
  const tiers = sizeOf(config).tiers.map((tier) => {
    const layout = { ...tier, base }
    base += tier.height
    return layout
  })
  const top = tiers[tiers.length - 1]
  const topY = top.base + top.height
  const maxRadius = tiers[0].radius + FROSTING
  const small = toppingScale(top.radius)

  // Drips run down the top edge of every tier.
  const drips: Drip[] = []
  if (config.drip !== 'none') {
    for (const tier of tiers) {
      const outer = tier.radius + FROSTING
      const count = Math.round((Math.PI * 2 * outer) / (light ? 0.16 : 0.105))
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (random() - 0.5) * 0.08
        const long = random()
        const length = tier.height * (0.1 + long * long * 0.48)
        const { x, z } = polar(outer + 0.006, angle)
        drips.push({ x, z, top: tier.base + tier.height - BEVEL * 0.7, length, part: partAt(angle) })
      }
    }
  }

  const ring = Object.fromEntries(
    [...RING_TOPPINGS, 'cream-kisses'].map((id) => [id, [] as Placement[]]),
  ) as CakeLayout['ring']

  const kisses = config.toppings.includes('cream-kisses')
  if (kisses) {
    // A piped border along the top edge of every tier.
    for (const tier of tiers) {
      const radius = tier.radius - 0.02
      const count = Math.round((Math.PI * 2 * radius) / (light ? 0.17 : 0.13))
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2
        const { x, z } = polar(radius, angle)
        ring['cream-kisses'].push({
          x,
          z,
          y: tier.base + tier.height - 0.005,
          yaw: random() * Math.PI * 2,
          tilt: 0,
          scale: 0.8 + random() * 0.15,
          part: partAt(angle),
          variant: 0,
        })
      }
    }
  }

  // Fruit, macarons and shards share one ring on the top tier, taking turns.
  const kinds = RING_TOPPINGS.filter((id) => config.toppings.includes(id))
  if (kinds.length) {
    const radius = top.radius * (kisses ? 0.62 : 0.72)
    const spacing = kinds.includes('macarons') ? 0.24 : 0.2
    const count = Math.max(kinds.length * 2, Math.round((Math.PI * 2 * radius) / spacing))
    const offset = random() * 0.4
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + offset
      const kind = kinds[i % kinds.length]
      const { x, z } = polar(radius, angle)
      ring[kind].push({
        x,
        z,
        y: topY,
        // Macarons and shards turn their flat face outwards; fruit is turned at random.
        yaw: kind === 'macarons' || kind === 'chocolate-shards' ? angle : random() * Math.PI * 2,
        tilt: kind === 'macarons' ? 0.45 : kind === 'chocolate-shards' ? 0.25 + random() * 0.2 : 0,
        scale: (0.9 + random() * 0.2) * small,
        part: partAt(angle),
        variant: i,
      })
    }
  }

  // Sprinkles over every exposed top surface.
  const sprinkles: Placement[] = []
  if (config.toppings.includes('sprinkles')) {
    tiers.forEach((tier, index) => {
      const above = tiers[index + 1]
      const inner = above ? above.radius + FROSTING + 0.02 : 0
      const outer = tier.radius - 0.03
      const area = Math.PI * (outer * outer - inner * inner)
      const count = Math.round(area * (light ? 70 : 150))
      for (let i = 0; i < count; i++) {
        const r = Math.sqrt(inner * inner + random() * (outer * outer - inner * inner))
        const angle = random() * Math.PI * 2
        const { x, z } = polar(r, angle)
        sprinkles.push({
          x,
          z,
          y: tier.base + tier.height + 0.006,
          yaw: random() * Math.PI,
          tilt: 0,
          scale: 0.85 + random() * 0.3,
          part: partAt(angle),
          variant: Math.floor(random() * 6),
        })
      }
    })
  }

  const goldLeaf: Placement[] = []
  if (config.toppings.includes('gold-leaf')) {
    const count = Math.round((light ? 8 : 14) * small)
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2
      const onTop = random() > 0.45
      const r = onTop ? top.radius * (0.2 + random() * 0.75) : top.radius + FROSTING + 0.003
      const { x, z } = polar(r, angle)
      goldLeaf.push({
        x,
        z,
        y: onTop ? topY + 0.004 : top.base + top.height * (0.55 + random() * 0.35),
        yaw: onTop ? random() * Math.PI : angle,
        tilt: onTop ? 0 : 1,
        scale: (0.6 + random() * 0.7) * small,
        part: partAt(angle),
        variant: Math.floor(random() * 4),
      })
    }
  }

  // With a message, the candles stand in a wide arc in front of the plaque (which sits further back), so the
  // words stay readable even with nine candles on a 10 cm bento.
  const candles: Placement[] = []
  const lone = config.candles === 1 && !config.message
  for (let i = 0; i < config.candles; i++) {
    const spread = config.message ? Math.PI * 1.1 : Math.PI * 2
    const angle = lone ? 0 : -spread / 2 + (spread * (i + 0.5)) / config.candles
    const r = lone ? 0 : top.radius * (config.message ? 0.5 : 0.42)
    const { x, z } = polar(r, angle)
    candles.push({
      x,
      z,
      y: topY,
      yaw: 0,
      tilt: 0,
      scale: small,
      part: r === 0 ? 'body' : partAt(angle),
      variant: i,
    })
  }

  const plaque = config.message
    ? {
        y: topY,
        z: -top.radius * 0.38,
        width: Math.min(1.05, top.radius * 1.15),
        scale: Math.min(1, Math.max(0.78, top.radius / 0.8)),
        lift: config.candles > 0 && top.radius < 0.75 ? 0.24 * small : 0,
      }
    : null

  return {
    seed,
    tiers,
    top,
    topY,
    totalHeight: topY,
    maxRadius,
    drips,
    ring,
    sprinkles,
    goldLeaf,
    candles,
    plaque,
  }
}
