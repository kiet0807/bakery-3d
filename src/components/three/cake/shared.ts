import * as THREE from 'three'
import { flameGeometry, kissGeometry, shardGeometry, stemGeometry, strawberryGeometry } from './geometry'

/**
 * Geometries every cake reuses. They are made once per page and never change, so a cake with forty
 * strawberries still uploads one strawberry to the GPU.
 */
export interface SharedGeometry {
  strawberry: THREE.BufferGeometry
  calyx: THREE.BufferGeometry
  blueberry: THREE.BufferGeometry
  macaronShell: THREE.BufferGeometry
  macaronFilling: THREE.BufferGeometry
  cherry: THREE.BufferGeometry
  stem: THREE.BufferGeometry
  kiss: THREE.BufferGeometry
  shards: THREE.BufferGeometry[]
  sprinkle: THREE.BufferGeometry
  flakes: THREE.BufferGeometry[]
  dripColumn: THREE.BufferGeometry
  dripBulb: THREE.BufferGeometry
  candle: THREE.BufferGeometry
  wick: THREE.BufferGeometry
  flame: THREE.BufferGeometry
}

/** A torn flake of gold leaf: an irregular, flat polygon. */
function flakeGeometry(seed: number) {
  let s = seed
  const random = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  const corners = 6 + Math.floor(random() * 3)
  const points = Array.from({ length: corners }, (_, i) => {
    const a = (i / corners) * Math.PI * 2
    const r = 0.012 + random() * 0.014
    return new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r * (0.6 + random() * 0.6))
  })
  return new THREE.ShapeGeometry(new THREE.Shape(points))
}

let cache: SharedGeometry | null = null

export function shared(): SharedGeometry {
  if (cache) return cache
  // A drip of glaze, from its bulb (y = -1, scaled by its length per instance) up to the edge (y = 0): wide
  // where it leaves the edge, thinning as it runs, swelling a little into the bulb. It ends inside the glaze on the
  // rim: a lip above it stood out of the rim as a row of thorns. Listed bottom to top, so the lathe's faces point
  // outwards.
  const dripProfile = [
    [0.037, -1],
    [0.036, -0.92],
    [0.033, -0.75],
    [0.035, -0.4],
    [0.038, -0.1],
    [0.04, 0],
  ].map(([r, y]) => new THREE.Vector2(r, y))
  const dripColumn = new THREE.LatheGeometry(dripProfile, 12)
  const macaronShell = new THREE.SphereGeometry(0.085, 22, 12)
  macaronShell.scale(1, 0.4, 1)
  const blueberry = new THREE.SphereGeometry(0.04, 14, 10)
  blueberry.scale(1, 0.88, 1)
  cache = {
    strawberry: strawberryGeometry(),
    calyx: new THREE.ConeGeometry(0.062, 0.026, 6),
    blueberry,
    macaronShell,
    macaronFilling: new THREE.CylinderGeometry(0.071, 0.071, 0.026, 22),
    cherry: new THREE.SphereGeometry(0.056, 18, 14),
    stem: stemGeometry(),
    kiss: kissGeometry(),
    shards: [shardGeometry(11), shardGeometry(23), shardGeometry(37)],
    sprinkle: new THREE.CapsuleGeometry(0.0085, 0.03, 2, 6),
    flakes: [5, 13, 29, 47].map(flakeGeometry),
    dripColumn,
    dripBulb: new THREE.SphereGeometry(0.041, 12, 10),
    candle: new THREE.CylinderGeometry(0.02, 0.02, 0.3, 14),
    wick: new THREE.CylinderGeometry(0.0035, 0.0035, 0.03, 4),
    flame: flameGeometry(),
  }
  return cache
}

let buttercream: THREE.Texture | null = null

/**
 * Faint spatula marks running around the cake, used as a bump map so the frosting catches the light
 * like real buttercream instead of looking like plastic. Lathe UVs run around the cake on u.
 */
export function buttercreamTexture(): THREE.Texture | null {
  if (buttercream) return buttercream
  if (typeof document === 'undefined') return null
  const width = 512
  const height = 256
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = 'rgb(128,128,128)'
  ctx.fillRect(0, 0, width, height)
  let seed = 9
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  for (let i = 0; i < 420; i++) {
    const y = random() * height
    const x = random() * width
    const length = 60 + random() * 260
    const shade = random() > 0.5 ? 255 : 0
    ctx.strokeStyle = `rgba(${shade},${shade},${shade},${0.03 + random() * 0.07})`
    ctx.lineWidth = 1 + random() * 5
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.bezierCurveTo(
      x + length * 0.3,
      y + (random() - 0.5) * 6,
      x + length * 0.7,
      y + (random() - 0.5) * 6,
      x + length,
      y,
    )
    ctx.stroke()
    // Wrap around so the seam where the lathe closes is invisible.
    if (x + length > width) {
      ctx.beginPath()
      ctx.moveTo(x - width, y)
      ctx.lineTo(x - width + length, y)
      ctx.stroke()
    }
  }
  buttercream = new THREE.CanvasTexture(canvas)
  buttercream.wrapS = THREE.RepeatWrapping
  buttercream.wrapT = THREE.ClampToEdgeWrapping
  buttercream.repeat.set(2, 1)
  return buttercream
}

let glow: THREE.Texture | null = null

/** Soft round glow behind each candle flame. */
export function glowTexture(): THREE.Texture | null {
  if (glow) return glow
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255,214,140,0.9)')
  gradient.addColorStop(0.35, 'rgba(255,170,80,0.35)')
  gradient.addColorStop(1, 'rgba(255,150,60,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  glow = new THREE.CanvasTexture(canvas)
  glow.colorSpace = THREE.SRGBColorSpace
  return glow
}
