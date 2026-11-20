'use client'

import { useEnvironment } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { GradientEquirectTexture, WebGLPathTracer } from 'three-gpu-pathtracer'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { usePerformanceHold } from './motion'
import { SCENE } from './theme'
import { CAFE_HDRI } from './Studio'

/** Samples per pixel for a finished photo: clean enough on glaze and cream, about 15–25 s on a laptop GPU. */
export const PHOTO_SAMPLES = 256

/**
 * The path tracer's random numbers: 1 is Sobol. The library's default (2, a stratified list offset by blue
 * noise per pixel) left a fixed maze of light and dark pixels on diffuse surfaces at 1x pixel ratio that did
 * not fade with more samples; Sobol and plain PCG both converge to a clean picture in the same time.
 */
const RANDOM_SOBOL = 1

/** The renderer inside `WebGLPathTracer` is private in three-gpu-pathtracer 0.0.28; its material is not. */
type WithMaterial = { _pathTracer?: { material?: { setDefine?: (name: string, value: number) => void } } }

/** How brightly candle flames shine in the photo, as emissive intensity. */
const FLAME_GLOW = 6

/** The subset of troika's Text mesh that the photo needs. */
interface TroikaText extends THREE.Mesh {
  text: string
  fontSize: number
  color: THREE.ColorRepresentation
  maxWidth: number
  lineHeight: number | 'normal'
  textRenderInfo?: { blockBounds: [number, number, number, number] } | null
}

const isTroikaText = (object: THREE.Object3D): object is TroikaText =>
  typeof (object as Partial<TroikaText> & { sync?: unknown }).sync === 'function' &&
  typeof (object as Partial<TroikaText>).text === 'string'

/**
 * three-gpu-pathtracer 0.0.28 can render clearcoat as black under three r187 (seen on the high tier). The photo
 * copies glossy materials without it and moves their roughness towards the coat's, which keeps most of the shine.
 */
function photoMaterial(material: THREE.Material, owned: { dispose: () => void }[]): THREE.Material {
  // Unlit materials (candle flames) would come out as dull orange cones: in the photo they give off light.
  const basic = material as THREE.MeshBasicMaterial
  if (basic.isMeshBasicMaterial && !basic.map && !basic.transparent) {
    // The high tier draws flames brighter than white for its bloom: bring the colour back to 0–1 first.
    const glow = basic.color.clone()
    glow.multiplyScalar(1 / Math.max(1, glow.r, glow.g, glow.b))
    const flame = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: glow,
      emissiveIntensity: FLAME_GLOW,
    })
    owned.push(flame)
    return flame
  }
  const physical = material as THREE.MeshPhysicalMaterial
  if (!physical.isMeshPhysicalMaterial || !(physical.clearcoat > 0)) return material
  const copy = physical.clone()
  copy.clearcoat = 0
  copy.roughness = Math.min(physical.roughness, Math.max(physical.clearcoatRoughness, 0.08))
  owned.push(copy)
  return copy
}

let floorTexture: THREE.CanvasTexture | null = null

/** A white disc that fades to nothing at its edge: the photo floor melts into the backdrop, no horizon line. */
function fadingFloorTexture() {
  if (floorTexture) return floorTexture
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.45, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  floorTexture = new THREE.CanvasTexture(canvas)
  floorTexture.colorSpace = THREE.SRGBColorSpace
  return floorTexture
}

/**
 * The path tracer sees one copy of an InstancedMesh's geometry, so each one is baked into plain geometry in
 * world space. Per-instance colours (the sprinkles) become vertex colours.
 */
function bakeInstances(mesh: THREE.InstancedMesh, owned: { dispose: () => void }[]): THREE.Mesh | null {
  const parts: THREE.BufferGeometry[] = []
  const matrix = new THREE.Matrix4()
  const color = new THREE.Color()
  const source = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, matrix)
    matrix.premultiply(mesh.matrixWorld)
    const part = new THREE.BufferGeometry()
    for (const name of ['position', 'normal', 'uv'] as const) {
      const attribute = source.getAttribute(name)
      if (attribute) part.setAttribute(name, attribute.clone())
    }
    part.applyMatrix4(matrix)
    if (mesh.instanceColor) {
      mesh.getColorAt(i, color)
      const count = part.getAttribute('position').count
      const colors = new Float32Array(count * 4)
      for (let v = 0; v < count; v++) colors.set([color.r, color.g, color.b, 1], v * 4)
      part.setAttribute('color', new THREE.BufferAttribute(colors, 4))
    }
    parts.push(part)
  }
  if (source !== mesh.geometry) source.dispose()
  if (!parts.length) return null
  const merged = mergeGeometries(parts)
  parts.forEach((part) => part.dispose())
  if (!merged) return null
  owned.push(merged)
  let material = photoMaterial(mesh.material as THREE.Material, owned)
  if (mesh.instanceColor) {
    if (material === mesh.material) {
      material = material.clone()
      owned.push(material)
    }
    ;(material as THREE.MeshStandardMaterial).vertexColors = true
  }
  return new THREE.Mesh(merged, material)
}

let fontReady: Promise<boolean> | null = null

/** Pacifico for the canvas copy of the message, loaded once. */
function loadPhotoFont(): Promise<boolean> {
  fontReady ??= new FontFace('Kai Photo Pacifico', 'url(/fonts/Pacifico-Subset.woff)')
    .load()
    .then((face) => {
      document.fonts.add(face)
      return true
    })
    .catch(() => false)
  return fontReady
}

/** troika draws text with its own shader, which the path tracer cannot read: paint it on a plane instead. */
async function textPlane(text: TroikaText): Promise<THREE.Mesh | null> {
  const bounds = text.textRenderInfo?.blockBounds
  if (!bounds || !text.text) return null
  await loadPhotoFont()
  const [x0, y0, x1, y1] = bounds
  const width = x1 - x0
  const height = y1 - y0
  const scale = 1400 // canvas pixels per scene unit
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(8, Math.ceil(width * scale))
  canvas.height = Math.max(8, Math.ceil(height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const size = text.fontSize * scale
  ctx.font = `${size}px "Kai Photo Pacifico", cursive`
  ctx.fillStyle = new THREE.Color(text.color).getStyle()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // Break where the text breaks (the plaque sets its own line breaks), then wrap like troika at its max width.
  const lines: string[] = []
  for (const paragraph of text.text.split('\n')) {
    const first = lines.length
    for (const word of paragraph.split(' ')) {
      const last = lines.length > first ? lines[lines.length - 1] : undefined
      if (last !== undefined && ctx.measureText(`${last} ${word}`).width <= text.maxWidth * scale)
        lines[lines.length - 1] = `${last} ${word}`
      else lines.push(word)
    }
  }
  const step = canvas.height / lines.length
  lines.forEach((line, i) => ctx.fillText(line, canvas.width / 2, step * (i + 0.5)))
  const map = new THREE.CanvasTexture(canvas)
  map.colorSpace = THREE.SRGBColorSpace
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ map, transparent: true, alphaTest: 0.4, roughness: 0.55 }),
  )
  plane.matrixAutoUpdate = false
  plane.matrix
    .copy(text.matrixWorld)
    .multiply(new THREE.Matrix4().makeTranslation((x0 + x1) / 2, (y0 + y1) / 2, 0.001))
  plane.matrixWorld.copy(plane.matrix)
  return plane
}

/**
 * Copies what the camera sees into a still scene the path tracer understands, plus a studio floor and
 * the site's morning-sky gradient behind it. Shared geometry and materials are reused; only what is made here is
 * disposed afterwards.
 */
async function buildPhotoScene(scene: THREE.Scene, floorY: number, environment: THREE.Texture) {
  scene.updateMatrixWorld(true)
  const photo = new THREE.Scene()
  const owned: { dispose: () => void }[] = []
  const pending: Promise<THREE.Mesh | null>[] = []

  scene.traverseVisible((object) => {
    if (object.userData.noPhoto) return
    if ((object as THREE.InstancedMesh).isInstancedMesh) {
      const baked = bakeInstances(object as THREE.InstancedMesh, owned)
      if (baked) photo.add(baked)
    } else if (isTroikaText(object)) {
      pending.push(textPlane(object))
    } else if ((object as THREE.Mesh).isMesh) {
      const mesh = object as THREE.Mesh
      const copy = new THREE.Mesh(mesh.geometry, photoMaterial(mesh.material as THREE.Material, owned))
      copy.matrixAutoUpdate = false
      copy.matrix.copy(mesh.matrixWorld)
      copy.matrixWorld.copy(mesh.matrixWorld)
      photo.add(copy)
    }
    // The live scene's sun and fill lights are left out: their hard shadows came out as a coarse maze-like grain
    // on the floor at 1× DPR. The café HDRI alone lights the photo like a soft box; a finer grain still shows in
    // deep shade on 1× screens.
  })

  for (const plane of await Promise.all(pending)) {
    if (!plane) continue
    owned.push(
      plane.geometry,
      plane.material as THREE.Material,
      (plane.material as THREE.MeshStandardMaterial).map!,
    )
    photo.add(plane)
  }

  // A studio floor that catches the shadows and reflections, then fades into the backdrop.
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(6, 128),
    new THREE.MeshStandardMaterial({
      color: SCENE.photo.floor,
      map: fadingFloorTexture(),
      transparent: true,
      roughness: 0.3,
      metalness: 0,
    }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = floorY
  owned.push(floor.geometry, floor.material)
  photo.add(floor)

  const sky = new GradientEquirectTexture(256)
  sky.topColor.set(SCENE.photo.skyTop)
  sky.bottomColor.set(SCENE.photo.skyBottom)
  sky.exponent = 1.2
  sky.update()
  owned.push(sky)
  photo.background = sky
  // The café HDRI itself, as an equirect image. The live scenes light with a cube map (the HDRI plus soft
  // panels), which this path tracer cannot convert under three r187.
  photo.environment = environment
  // The only light in the photo (with the flames), so brighter than the live scene's share of it.
  photo.environmentIntensity = 1.3
  photo.updateMatrixWorld(true)

  return { photo, dispose: () => owned.forEach((item) => item.dispose()) }
}

/**
 * Photo mode: a path tracer takes over the canvas and refines the frame sample by sample, so the visitor
 * watches the picture develop. While mounted it also becomes the thing that `drawRef` draws, so "Download"
 * copies the path-traced frame. Mount it only while the camera and the cake stay still.
 */
interface PhotoModeProps {
  floorY: number
  drawRef: RefObject<(() => void) | null>
  onProgress: (progress: number) => void
  /** The device could not path trace (no float textures, shader too large…): leave photo mode. */
  onError: (error: unknown) => void
  samples?: number
}

export function PhotoMode(props: PhotoModeProps) {
  // On the low tier the café light has not been downloaded yet: the live view keeps drawing meanwhile.
  return (
    <Suspense fallback={null}>
      <PathTracedPhoto {...props} />
    </Suspense>
  )
}

function PathTracedPhoto({ floorY, drawRef, onProgress, onError, samples = PHOTO_SAMPLES }: PhotoModeProps) {
  const environment = useEnvironment({ files: CAFE_HDRI })
  const performance = usePerformanceHold()
  // Path tracing drops the frame rate on purpose: keep the quality tier (and this canvas) as it is.
  useEffect(() => performance.hold(), [performance])
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)
  const tracer = useRef<WebGLPathTracer | null>(null)
  const reported = useRef(-1)

  useEffect(() => {
    let cancelled = false
    let cleanup = () => {}
    buildPhotoScene(scene, floorY, environment)
      .then(({ photo, dispose }) => {
        if (cancelled) {
          dispose()
          return
        }
        let pathTracer: WebGLPathTracer
        try {
          pathTracer = new WebGLPathTracer(gl)
          pathTracer.bounces = 6
          pathTracer.transmissiveBounces = 4
          pathTracer.filterGlossyFactor = 0.75
          pathTracer.renderDelay = 0
          pathTracer.minSamples = 1
          pathTracer.fadeDuration = 400
          pathTracer.tiles.set(2, 2)
          ;(pathTracer as unknown as WithMaterial)._pathTracer?.material?.setDefine?.(
            'RANDOM_TYPE',
            RANDOM_SOBOL,
          )
          pathTracer.setScene(photo, camera)
        } catch (error) {
          dispose()
          onError(error)
          return
        }
        tracer.current = pathTracer
        drawRef.current = () => {
          pathTracer.pausePathTracing = true
          pathTracer.renderSample()
        }
        cleanup = () => {
          drawRef.current = null
          tracer.current = null
          pathTracer.dispose()
          dispose()
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) onError(error)
      })
    return () => {
      cancelled = true
      cleanup()
    }
    // onError is read when it is needed, not a reason to rebuild the photo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera, floorY, drawRef, environment])

  // Priority 1: while photo mode is on, this is the only thing that draws to the canvas.
  useFrame(() => {
    const pathTracer = tracer.current
    if (!pathTracer) {
      gl.render(scene, camera)
      return
    }
    pathTracer.pausePathTracing = pathTracer.samples >= samples
    try {
      pathTracer.renderSample()
    } catch (error) {
      tracer.current = null
      onError(error)
      return
    }
    const progress = Math.min(1, Math.floor(pathTracer.samples) / samples)
    const step = Math.floor(progress * 100)
    if (step !== reported.current) {
      reported.current = step
      onProgress(progress)
    }
  }, 1)

  return null
}
