import * as THREE from 'three'
import { createRandom } from '@/lib/random'

/** The wedge a customer can cut out, centred on the side that faces the camera (+Z). */
export const SLICE_ANGLE = Math.PI / 3.6
export const FROSTING = 0.055
export const BEVEL = 0.075

/**
 * Side profile of one tier (x = distance from the centre, y = height), from the bottom edge up, with a
 * rounded top edge like real buttercream. Revolved by LatheGeometry it becomes the frosted tier.
 */
export function tierProfile(radius: number, height: number): THREE.Vector2[] {
  const outer = radius + FROSTING
  const points = [new THREE.Vector2(outer, 0), new THREE.Vector2(outer, height - BEVEL)]
  const steps = 8
  for (let i = 1; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2)
    points.push(new THREE.Vector2(outer - BEVEL + Math.cos(a) * BEVEL, height - BEVEL + Math.sin(a) * BEVEL))
  }
  points.push(new THREE.Vector2(0, height))
  return points
}

/** Frosting surface of a tier between two angles (three.js measures angles from +Z towards +X). */
export function tierSurface(radius: number, height: number, phiStart: number, phiLength: number) {
  const segments = Math.max(8, Math.round((phiLength / (Math.PI * 2)) * 128))
  return new THREE.LatheGeometry(tierProfile(radius, height), segments, phiStart, phiLength)
}

/**
 * The flat face left by a knife: the area under the tier profile. UVs run from the centre (u = 0) to the
 * outside (u = 1) and from the bottom (v = 0) to the top (v = 1), matching cutFaceTexture.
 */
export function cutFace(radius: number, height: number) {
  const profile = tierProfile(radius, height)
  const shape = new THREE.Shape([new THREE.Vector2(0, 0), ...profile])
  const geometry = new THREE.ShapeGeometry(shape, 6)
  const outer = radius + FROSTING
  const position = geometry.getAttribute('position')
  const uv = geometry.getAttribute('uv')
  for (let i = 0; i < position.count; i++) uv.setXY(i, position.getX(i) / outer, position.getY(i) / height)
  uv.needsUpdate = true
  return geometry
}

/** Rotation that turns a shape drawn in the XY plane into the half-plane at angle phi around Y. */
export const faceRotation = (phi: number) => phi - Math.PI / 2

export interface CutTextureInput {
  radius: number
  height: number
  sponge: string
  filling: string
  frosting: string
  seed: number
}

/**
 * Paints the inside of a tier: sponge and filling layers, crumbs and the frosting coat around them.
 * Drawn on a canvas so every flavour combination needs no image files.
 */
export function cutFaceTexture({ radius, height, sponge, filling, frosting, seed }: CutTextureInput) {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const outer = radius + FROSTING
  const innerWidth = (radius / outer) * size
  const innerHeight = ((height - FROSTING) / height) * size
  const random = createRandom(seed)

  ctx.fillStyle = frosting
  ctx.fillRect(0, 0, size, size)

  // Three sponge layers with two fillings between them, sponge three times as thick.
  const bands = ['s', 'f', 's', 'f', 's'] as const
  const units = bands.reduce((sum, band) => sum + (band === 's' ? 3 : 1), 0)
  let y = size
  for (const band of bands) {
    const bandHeight = ((band === 's' ? 3 : 1) / units) * innerHeight
    ctx.fillStyle = band === 's' ? sponge : filling
    ctx.fillRect(0, y - bandHeight, innerWidth, bandHeight)
    if (band === 's') {
      // Crumbs: small lighter and darker specks.
      for (let i = 0; i < 260; i++) {
        const px = random() * innerWidth
        const py = y - random() * bandHeight
        ctx.fillStyle = random() > 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(60,30,10,0.16)'
        ctx.beginPath()
        ctx.arc(px, py, 0.6 + random() * 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
    } else {
      // A soft, slightly wavy edge where filling meets sponge.
      ctx.fillStyle = 'rgba(255,255,255,0.12)'
      ctx.fillRect(0, y - bandHeight, innerWidth, Math.max(1, bandHeight * 0.25))
    }
    y -= bandHeight
  }
  // A little shade where the frosting meets the sponge.
  ctx.fillStyle = 'rgba(0,0,0,0.06)'
  ctx.fillRect(innerWidth - 2, size - innerHeight, 2, innerHeight)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/** Strawberry: a rounded cone, widest a third of the way up. */
export function strawberryGeometry() {
  const points = [
    [0, 0],
    [0.035, 0.012],
    [0.07, 0.045],
    [0.088, 0.09],
    [0.082, 0.13],
    [0.055, 0.16],
    [0, 0.168],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  return new THREE.LatheGeometry(points, 20)
}

/** Piped cream kiss: a soft dome that ends in a curled tip. */
export function kissGeometry() {
  const points = [
    [0.082, 0],
    [0.086, 0.018],
    [0.072, 0.05],
    [0.05, 0.085],
    [0.028, 0.115],
    [0.012, 0.14],
    [0, 0.152],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  return new THREE.LatheGeometry(points, 18)
}

/** Candle flame: a teardrop. */
export function flameGeometry() {
  const points = [
    [0, 0],
    [0.016, 0.012],
    [0.02, 0.03],
    [0.014, 0.055],
    [0, 0.085],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  return new THREE.LatheGeometry(points, 12)
}

/** A snapped piece of chocolate: an irregular, slightly bevelled polygon. */
export function shardGeometry(seed: number) {
  const random = createRandom(seed)
  const shape = new THREE.Shape()
  const corners = 4 + Math.floor(random() * 2)
  for (let i = 0; i < corners; i++) {
    const a = (i / corners) * Math.PI * 2 + random() * 0.6
    const r = 0.07 + random() * 0.07
    const x = Math.cos(a) * r * 0.75
    const y = Math.sin(a) * r * 1.4 + 0.1
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 1,
  })
  geometry.translate(0, 0, -0.006)
  return geometry
}

/** Stem of a cherry: a thin tube that curves up and away. */
export function stemGeometry() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.055, 0),
    new THREE.Vector3(0.01, 0.1, 0.004),
    new THREE.Vector3(0.035, 0.15, 0.01),
    new THREE.Vector3(0.06, 0.18, 0.012),
  ])
  return new THREE.TubeGeometry(curve, 12, 0.0055, 5, false)
}

const stripes = new Map<string, THREE.CanvasTexture | null>()

/** Stripes for candles, painted once per colour pair and shared by every candle on the page. */
export function stripeTexture(colors: [string, string]) {
  const key = colors.join()
  if (!stripes.has(key)) stripes.set(key, paintStripes(colors))
  return stripes.get(key) ?? null
}

function paintStripes(colors: [string, string]) {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = colors[0]
  ctx.fillRect(0, 0, 64, 64)
  ctx.strokeStyle = colors[1]
  ctx.lineWidth = 9
  for (let i = -64; i < 128; i += 22) {
    ctx.beginPath()
    ctx.moveTo(i, 64)
    ctx.lineTo(i + 64, 0)
    ctx.stroke()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, 3)
  return texture
}
