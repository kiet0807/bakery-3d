import { configKey, macaronCount, sizeOf, type CakeConfig, type ToppingId } from '@/lib/cake'
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
  /** Index of the tier it runs down (0 = bottom), so fresh glaze can run from each tier's own edge. */
  tier: number
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

/** Radius of the ring of fruit, macarons and shards on a top tier; it moves in when piped kisses line the edge. */
const ringRadius = (topRadius: number, kisses: boolean) => topRadius * (kisses ? 0.62 : 0.72)

/** Diameter of a macaron shell at scale 1 (Toppings.tsx), in scene units (1 unit = 10 cm). */
const MACARON_DIAMETER = 0.17
/** How far the top of a macaron standing on the cake reaches, at scale 1 (it leans back 0.45 rad). */
const MACARON_REACH = 0.18
/** A real macaron is about 3.5 cm across; on a small top it shrinks with the other toppings. */
const MACARON_SCALE = 2

/**
 * Where the macarons sit on the ring: `pitch` is the length of ring each one owns, `width` its size across.
 * They are full size, but leave room between them for one piece of fruit when other ring toppings are chosen.
 */
function macaronRing(topRadius: number, kisses: boolean, count: number, shared: boolean) {
  const pitch = (Math.PI * 2 * ringRadius(topRadius, kisses)) / count
  const full = MACARON_DIAMETER * MACARON_SCALE * toppingScale(topRadius)
  return { pitch, width: Math.min(full, pitch - (shared ? 0.17 : 0.03)) }
}

/** Height of the chocolate plaque at full size, and of a candle from the cake top to the tip of its flame. */
export const PLAQUE_HEIGHT = 0.27
const FLAME_TIP = 0.385

/**
 * The plaque for a message on a top tier of this radius. On a small top crowded with candles it stands on longer
 * sticks, like a cake topper, so its lower edge clears the flame tips and every word stays readable.
 */
function plaqueShape(topRadius: number, candles: number) {
  const scale = Math.min(1, Math.max(0.78, topRadius / 0.8))
  const lift = candles > 0 && topRadius < 0.75 ? FLAME_TIP * toppingScale(topRadius) - 0.03 : 0
  return { z: -topRadius * 0.38, width: Math.min(1.05, topRadius * 1.15), scale, lift }
}

/** Rough advance of a Pacifico letter, in ems: enough to choose between one line and two. */
const SCRIPT_ADVANCE = 0.52
export const PLAQUE_LINE_HEIGHT = 1.05

/**
 * Lays a message out on one line or two, whichever lets the letters stay bigger in a box of this size. Two
 * lines break at the space nearest the middle ("Chúc mừng / sinh nhật Mẹ"), so no short word is left alone.
 */
export function plaqueLines(message: string, width: number, height: number, fontSize: number): string {
  const middle = message.length / 2
  let split = -1
  for (let i = message.indexOf(' '); i !== -1; i = message.indexOf(' ', i + 1))
    if (split === -1 || Math.abs(i - middle) < Math.abs(split - middle)) split = i
  if (split === -1) return message
  const em = fontSize * SCRIPT_ADVANCE
  const line = fontSize * PLAQUE_LINE_HEIGHT
  const one = Math.min(1, width / (message.length * em), height / line)
  const longest = Math.max(split, message.length - split - 1)
  const two = Math.min(1, width / (longest * em), height / (2 * line))
  return two > one ? `${message.slice(0, split)}\n${message.slice(split + 1)}` : message
}

/**
 * Room needed above the top tier for what stands on it (plaque, candles, toppings). Cameras, the vitrine's glass
 * cloche and the cake box all size themselves with this, so a lifted plaque never pokes through a lid.
 */
export function headroom(config: CakeConfig): number {
  const tiers = sizeOf(config).tiers
  const top = tiers[tiers.length - 1].radius
  let plain = config.candles ? 0.4 : 0.22
  if (config.message) {
    const { scale, lift } = plaqueShape(top, config.candles)
    plain = 0.03 + lift + PLAQUE_HEIGHT * scale + 0.12
  }
  if (!config.toppings.includes('macarons')) return plain
  // Full-size macarons stand taller than the other toppings; the largest random scale is 1.04.
  const kisses = config.toppings.includes('cream-kisses')
  const shared = config.toppings.some(
    (id) => id !== 'macarons' && (RING_TOPPINGS as readonly string[]).includes(id),
  )
  const { width } = macaronRing(top, kisses, macaronCount(config.size), shared)
  return Math.max(plain, (width / MACARON_DIAMETER) * 1.04 * MACARON_REACH + 0.05)
}

export function computeLayout(config: CakeConfig, { light = false }: LayoutOptions = {}): CakeLayout {
  // Sweetness does not show on the cake; the seed only varies the sponge's cut face.
  const seed = hashString(configKey({ ...config, sweetness: 'less' }))
  // Each kind of decoration draws from its own random stream, seeded only by what changes its own shape. A new
  // frosting colour, a message or another topping then leaves the sprinkles (and the rest) exactly where they
  // were: on the design page nothing jumps that the visitor did not touch.
  const stream = (...parts: (string | number | boolean)[]) =>
    createRandom(hashString([config.size, light, ...parts].join('|')))
  let random = stream('drips')
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
    for (const [index, tier] of tiers.entries()) {
      const outer = tier.radius + FROSTING
      const count = Math.round((Math.PI * 2 * outer) / (light ? 0.16 : 0.105))
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (random() - 0.5) * 0.08
        const long = random()
        const length = tier.height * (0.1 + long * long * 0.48)
        const { x, z } = polar(outer + 0.006, angle)
        drips.push({
          x,
          z,
          top: tier.base + tier.height - BEVEL * 0.7,
          length,
          part: partAt(angle),
          tier: index,
        })
      }
    }
  }

  const ring = Object.fromEntries(
    [...RING_TOPPINGS, 'cream-kisses'].map((id) => [id, [] as Placement[]]),
  ) as CakeLayout['ring']

  const kisses = config.toppings.includes('cream-kisses')
  random = stream('kisses')
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

  // Fruit, macarons and shards share one ring on the top tier, every piece at an angle along it.
  const kinds = RING_TOPPINGS.filter((id) => config.toppings.includes(id))
  if (kinds.length) {
    const radius = ringRadius(top.radius, kisses)
    const others = kinds.filter((id) => id !== 'macarons')
    // The ring's turn depends on the size alone, so adding fruit leaves the macarons standing where they were.
    const offset = stream('ring-turn')() * 0.4
    random = stream('ring', ...kinds, kisses)
    const pieces: { angle: number; kind: (typeof RING_TOPPINGS)[number]; macaronScale?: number }[] = []
    if (kinds.includes('macarons')) {
      // Macarons are counted (macaronCount, the number the topping promises) and full size, spread evenly; the
      // other kinds fill the gaps between them, taking turns, at least one piece per gap.
      const macarons = macaronCount(config.size)
      const { pitch, width } = macaronRing(top.radius, kisses, macarons, others.length > 0)
      const between = others.length ? Math.max(1, Math.floor((pitch - width) / 0.2)) : 0
      // With candles or a message, the front (angle 0) falls between two macarons, so they frame the candles and
      // the plaque instead of standing in front of them.
      const framed = config.candles > 0 || Boolean(config.message)
      const first = framed ? pitch / 2 / radius + (offset - 0.2) / 2 : offset
      let turn = 0
      for (let k = 0; k < macarons; k++) {
        const start = (k * pitch) / radius + first
        pieces.push({ angle: start, kind: 'macarons', macaronScale: width / MACARON_DIAMETER })
        for (let j = 0; j < between; j++) {
          const along = width / 2 + ((pitch - width) * (j + 0.5)) / between
          pieces.push({ angle: start + along / radius, kind: others[turn++ % others.length] })
        }
      }
    } else {
      const count = Math.max(others.length * 2, Math.round((Math.PI * 2 * radius) / 0.2))
      for (let i = 0; i < count; i++)
        pieces.push({ angle: (i / count) * Math.PI * 2 + offset, kind: others[i % others.length] })
    }
    let macaron = 0
    pieces.forEach(({ angle, kind, macaronScale }, i) => {
      const { x, z } = polar(radius, angle)
      ring[kind].push({
        x,
        z,
        y: topY,
        // Macarons and shards turn their flat face outwards; fruit is turned at random.
        yaw: kind === 'macarons' || kind === 'chocolate-shards' ? angle : random() * Math.PI * 2,
        tilt: kind === 'macarons' ? 0.45 : kind === 'chocolate-shards' ? 0.25 + random() * 0.2 : 0,
        scale: macaronScale ? macaronScale * (0.96 + random() * 0.08) : (0.9 + random() * 0.2) * small,
        part: partAt(angle),
        // Each macaron its own colour, in turn.
        variant: kind === 'macarons' ? macaron++ : i,
      })
    })
  }

  // Sprinkles over every exposed top surface.
  const sprinkles: Placement[] = []
  random = stream('sprinkles')
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
  random = stream('gold-leaf')
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

  const plaque = config.message ? { y: topY, ...plaqueShape(top.radius, config.candles) } : null

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
