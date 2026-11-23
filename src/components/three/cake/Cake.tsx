'use client'

import { Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import * as THREE from 'three'
import { dripOf, fillingOf, frostingOf, spongeOf, type CakeConfig } from '@/lib/cake'
import { useReducedMotionScene } from '../motion'
import { MILK_CHOCOLATE, PLAQUE_LETTERING } from '../palette'
import { ColourTween, RESHAPE_MS, Timeline, easeOutCubic, easeOutSoft, useSettler } from '../tween'
import { Arrival, CakeShownContext } from './Arrival'
import { BEVEL, FROSTING, SLICE_ANGLE, cutFace, cutFaceTexture, faceRotation, tierSurface } from './geometry'
import {
  PLAQUE_HEIGHT,
  PLAQUE_LINE_HEIGHT,
  computeLayout,
  plaqueLines,
  type CakeLayout,
  type Drip,
  type Part,
  type TierLayout,
} from './layout'
import { buttercreamTexture, shared } from './shared'
import { Toppings } from './Toppings'

const HALF = SLICE_ANGLE / 2
const RANGES: Record<Part, [number, number]> = {
  body: [HALF, Math.PI * 2 - SLICE_ANGLE],
  slice: [-HALF, SLICE_ANGLE],
}
const PARTS: Part[] = ['body', 'slice']

/** Values a scene can drive frame by frame (the scroll story), each from 0 to 1. */
export interface CakeControls {
  slice: number
  drips: number
  toppings: number
}

export interface CakeProps {
  config: CakeConfig
  /** Pull the slice out to show the layers inside (animated). Ignored when `controls` is given. */
  sliced?: boolean
  /** Lighter version for scenes with several cakes. */
  light?: boolean
  /** Candles burning. */
  lit?: boolean
  controls?: RefObject<CakeControls | null>
  /** How far the slice travels when pulled out, in cake radii, and towards which angle (0 = camera). */
  sliceReach?: number
  sliceAngle?: number
  /** How far the slice turns when pulled out (radians), to show its cut face. */
  sliceTurn?: number
}

/** Glaze that pools on top of a tier and rolls over its rounded edge, where the drips start. */
function glazeProfile(radius: number, height: number) {
  const outer = radius + FROSTING
  const g = 0.012
  const points = [
    new THREE.Vector2(outer + 0.002, height - BEVEL - 0.035),
    new THREE.Vector2(outer + g, height - BEVEL - 0.03),
    new THREE.Vector2(outer + g, height - BEVEL),
  ]
  const steps = 8
  for (let i = 1; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2)
    points.push(
      new THREE.Vector2(
        outer - BEVEL + Math.cos(a) * (BEVEL + g),
        height - BEVEL + Math.sin(a) * (BEVEL + g),
      ),
    )
  }
  points.push(new THREE.Vector2(0, height + g))
  return points
}

function TierPiece({
  tier,
  part,
  material,
  texture,
  faces,
}: {
  tier: TierLayout
  part: Part
  /** The frosting, shared by every piece of the cake (its colour eases when the visitor picks another). */
  material: THREE.Material
  texture: THREE.Texture | null
  /** The cake's cut faces: shown only while the slice is out (see `Cake`). */
  faces: RefObject<Set<THREE.Object3D>>
}) {
  const [start, length] = RANGES[part]
  const surface = useMemo(
    () => tierSurface(tier.radius, tier.height, start, length),
    [tier.radius, tier.height, start, length],
  )
  const face = useMemo(() => cutFace(tier.radius, tier.height), [tier.radius, tier.height])
  useEffect(() => () => surface.dispose(), [surface])
  useEffect(() => () => face.dispose(), [face])

  return (
    <group position-y={tier.base}>
      <mesh geometry={surface} material={material} castShadow receiveShadow />
      {[HALF, -HALF].map((phi) => (
        <mesh
          key={phi}
          ref={(node) => {
            if (!node) return
            const all = faces.current
            all.add(node)
            return () => void all.delete(node)
          }}
          geometry={face}
          rotation-y={faceRotation(phi)}
          // The cake's frame loop shows it before the first frame if the slice starts out.
          visible={false}
          receiveShadow
        >
          <meshStandardMaterial
            map={texture}
            bumpMap={texture}
            bumpScale={0.6}
            roughness={0.92}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

function GlazeCap({ tier, part, material }: { tier: TierLayout; part: Part; material: THREE.Material }) {
  const [start, length] = RANGES[part]
  const geometry = useMemo(
    () =>
      new THREE.LatheGeometry(
        glazeProfile(tier.radius, tier.height),
        Math.max(8, Math.round((length / (Math.PI * 2)) * 128)),
        start,
        length,
      ),
    [tier.radius, tier.height, start, length],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry} material={material} position-y={tier.base} castShadow receiveShadow />
}

function Drips({ drips, material }: { drips: Drip[]; material: THREE.Material }) {
  const g = shared()
  const columns = useRef<THREE.InstancedMesh>(null)
  const bulbs = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    if (!columns.current || !bulbs.current) return
    const dummy = new THREE.Object3D()
    drips.forEach((d, i) => {
      // Short drips are thin trickles; long ones carry more glaze.
      const width = 0.8 + Math.min(1, d.length / 0.38) * 0.24 + (i % 3) * 0.03
      dummy.position.set(d.x, d.top, d.z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(width, d.length, width)
      dummy.updateMatrix()
      columns.current!.setMatrixAt(i, dummy.matrix)
      dummy.position.set(d.x, d.top - d.length, d.z)
      dummy.scale.set(width, width * 1.08, width)
      dummy.updateMatrix()
      bulbs.current!.setMatrixAt(i, dummy.matrix)
    })
    columns.current.instanceMatrix.needsUpdate = true
    bulbs.current.instanceMatrix.needsUpdate = true
    columns.current.computeBoundingSphere()
    bulbs.current.computeBoundingSphere()
  }, [drips])
  if (!drips.length) return null
  return (
    <group key={drips.length}>
      <instancedMesh ref={columns} args={[g.dripColumn, material, drips.length]} castShadow />
      <instancedMesh ref={bulbs} args={[g.dripBulb, material, drips.length]} castShadow />
    </group>
  )
}

/** The part of troika's Text mesh that the plaque reads to fit long messages. */
interface SyncedText extends THREE.Object3D {
  textRenderInfo?: { blockBounds: [number, number, number, number] } | null
}

function Plaque({ layout, message }: { layout: CakeLayout; message: string }) {
  if (!layout.plaque) return null
  const { y, z, width, scale, lift } = layout.plaque
  const height = PLAQUE_HEIGHT * scale
  const fontSize = 0.072 * scale
  const lines = plaqueLines(message, width * 0.9, height * 0.84, fontSize)
  // Then the block shrinks until it fits inside the chocolate, instead of spilling over it.
  const fit = (text: SyncedText) => {
    const bounds = text.textRenderInfo?.blockBounds
    if (!bounds) return
    const [x0, y0, x1, y1] = bounds
    const k = Math.min(1, (width * 0.9) / Math.max(1e-6, x1 - x0), (height * 0.84) / Math.max(1e-6, y1 - y0))
    text.scale.setScalar(k)
  }
  return (
    // Lands when the first letter is typed or when candles move it; typing itself changes only the words.
    <Arrival sig={`${z}:${width}:${scale}:${lift}`} height={0.4}>
      <group position={[0, y + height / 2 + 0.03 + lift, z]} rotation-x={-0.3}>
        <mesh castShadow>
          <boxGeometry args={[width, height, 0.024]} />
          <meshPhysicalMaterial color={MILK_CHOCOLATE} roughness={0.3} clearcoat={0.6} />
        </mesh>
        {[-width * 0.3, width * 0.3].map((x) => (
          <mesh key={x} position={[x, -height / 2 - 0.04 - lift / 2, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.1 + lift, 6]} />
            <meshStandardMaterial color={MILK_CHOCOLATE} />
          </mesh>
        ))}
        <Suspense fallback={null}>
          <Text
            font="/fonts/Pacifico-Subset.woff"
            fontSize={fontSize}
            onSync={fit}
            lineHeight={PLAQUE_LINE_HEIGHT}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            position={[0, 0.006, 0.0135]}
            color={PLAQUE_LETTERING}
          >
            {lines}
          </Text>
        </Suspense>
      </group>
    </Arrival>
  )
}

const smooth = (t: number) => t * t * (3 - 2 * t)
const settle = (t: number) => 1 - Math.pow(1 - t, 3)
/**
 * How far above the cake the toppings start when the story drops them on. The home page's title ends just above
 * the cake's top and is drawn under the scene: from higher up (1.4 before) they fell across the words.
 */
const TOPPINGS_DROP = 0.5

/** How long fresh glaze takes to run down the sides, in milliseconds. */
const POUR_MS = 760
const WHITE = new THREE.Color('#ffffff')

/** The cake's own materials, shared by every tier and by the body and the slice, so a colour changes in one place. */
function cakeMaterials() {
  return {
    frosting: new THREE.MeshPhysicalMaterial({
      roughness: 0.58,
      bumpMap: buttercreamTexture(),
      bumpScale: 1.4,
      sheen: 0.6,
      sheenColor: new THREE.Color('#ffffff'),
      sheenRoughness: 0.5,
    }),
    glaze: new THREE.MeshPhysicalMaterial({ roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.1 }),
    /** Piped kisses: the frosting, lightened. */
    kiss: new THREE.MeshPhysicalMaterial({
      roughness: 0.6,
      sheen: 0.4,
      sheenColor: new THREE.Color('#ffffff'),
    }),
  }
}

/**
 * A whole cake built from a design. The body and the slice are separate pieces that fit together, so
 * "slicing" is only a matter of moving the slice away. A scene can also drive the slice, the drips and the
 * toppings directly through `controls` (the scroll story does).
 *
 * When the design changes after the cake is on screen, it changes with it instead of jumping: colours ease
 * (`COLOUR_MS`), a new size grows or shrinks out of the old one and settles (`RESHAPE_MS`), new glaze runs down
 * the sides, and toppings, candles and the plaque drop in (`Arrival`). With reduced motion every change is
 * immediate, and `useSettler().finishAll()` jumps every one to its end (pictures, the studio photo).
 */
export function Cake({
  config,
  sliced = false,
  light = false,
  lit = true,
  controls,
  sliceReach = 0.75,
  sliceAngle = 0,
  sliceTurn = 0.28,
}: CakeProps) {
  const layout = useMemo(() => computeLayout(config, { light }), [config, light])
  const frosting = frostingOf(config).color
  const drip = config.drip === 'none' ? null : dripOf(config).color
  const sponge = spongeOf(config).color
  const filling = fillingOf(config).color
  // The cut faces are painted canvases: repaint them only when what they show changes (not on every letter of
  // the message, which used to cost a repaint and an upload per key press).
  const tierKey = layout.tiers.map((tier) => `${tier.radius}x${tier.height}`).join('/')
  const textures = useMemo(
    () =>
      tierKey.split('/').map((key, i) => {
        const [radius, height] = key.split('x').map(Number)
        return cutFaceTexture({ radius, height, sponge, filling, frosting, seed: 7919 * (i + 1) })
      }),
    [tierKey, sponge, filling, frosting],
  )
  useEffect(() => () => textures.forEach((t) => t?.dispose()), [textures])

  const [materials] = useState(cakeMaterials)
  useEffect(() => () => Object.values(materials).forEach((material) => material.dispose()), [materials])
  const [motion] = useState(() => ({
    frosting: new ColourTween(materials.frosting.color),
    glaze: new ColourTween(materials.glaze.color),
    reshape: new Timeline(),
    pour: new Timeline(),
  }))
  /** The scale a reshape starts from (old size over new), across and up. */
  const reshapeFrom = useRef({ across: 1, up: 1 })
  const root = useRef<THREE.Group>(null)
  const shown = useRef(false)
  useEffect(() => {
    shown.current = true
  }, [])
  const still = useReducedMotionScene()
  const settler = useSettler()
  const animate = () => shown.current && !still

  const lightenKisses = () => materials.kiss.color.copy(materials.frosting.color).lerp(WHITE, 0.55)
  useLayoutEffect(() => {
    motion.frosting.set(frosting, !animate())
    lightenKisses()
    return settler.add(() => {
      motion.frosting.finish()
      lightenKisses()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the colour changes, reading the rest
  }, [frosting])

  const hadDrip = useRef(false)
  useLayoutEffect(() => {
    if (!drip) {
      hadDrip.current = false
      return
    }
    // Glaze poured on a bare cake takes its colour at once and runs down the sides; glaze that changes colour
    // eases from the old one.
    const fresh = !hadDrip.current
    hadDrip.current = true
    motion.glaze.set(drip, fresh || !animate())
    if (fresh && animate()) motion.pour.play(POUR_MS)
    return settler.add(() => {
      motion.glaze.finish()
      motion.pour.finish()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the glaze changes, reading the rest
  }, [drip])

  const size = useRef<{ across: number; up: number } | null>(null)
  useLayoutEffect(() => {
    const before = size.current
    size.current = { across: layout.maxRadius, up: layout.topY }
    const group = root.current
    if (!before || !group || !animate()) return
    // Start from what is on screen now (the old size, or wherever an unfinished reshape had got to).
    reshapeFrom.current = {
      across: (before.across * group.scale.x) / layout.maxRadius,
      up: (before.up * group.scale.y) / layout.topY,
    }
    motion.reshape.play(RESHAPE_MS)
    group.scale.set(reshapeFrom.current.across, reshapeFrom.current.up, reshapeFrom.current.across)
    return settler.add(() => {
      motion.reshape.finish()
      group.scale.setScalar(1)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the size changes, reading the rest
  }, [layout.maxRadius, layout.topY])

  const sliceGroup = useRef<THREE.Group>(null)
  /** One group per tier and part: fresh glaze runs down from each tier's own top edge. */
  const dripGroups = useRef<Record<string, THREE.Group | null>>({})
  const toppingGroups = useRef<Partial<Record<Part, THREE.Group | null>>>({})
  const progress = useRef(sliced ? 1 : 0)
  /**
   * With the slice home the cut faces meet inside the closed cake, where nothing can see them, yet they cost four
   * draw calls a tier in every pass (the vitrine's six cakes: about 60 a frame). They are drawn only while the
   * slice is out.
   */
  const faces = useRef(new Set<THREE.Object3D>())
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => invalidate(), [sliced, invalidate])

  /** Puts the slice where `progress` says: out along `sliceAngle`, lifted and turned a little. */
  const placeSlice = () => {
    const slice = sliceGroup.current
    if (!slice) return
    const ease = smooth(Math.min(1, Math.max(0, progress.current)))
    for (const face of faces.current) face.visible = ease > 0
    const reach = ease * layout.maxRadius * sliceReach
    slice.position.set(Math.sin(sliceAngle) * reach, ease * 0.12, Math.cos(sliceAngle) * reach)
    slice.rotation.y = ease * sliceTurn
  }
  // Cutting or closing the cake: with reduced motion the slice is simply out or home; a picture taken while it
  // moves shows it where it is going (the settler).
  useLayoutEffect(() => {
    if (controls) return
    const target = sliced ? 1 : 0
    if (still) progress.current = target
    if (progress.current === target) return
    return settler.add(() => {
      progress.current = target
      placeSlice()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the cake is cut or closed, reading the rest
  }, [sliced, still])

  useFrame((_, delta) => {
    const now = performance.now()
    let moving = false
    if (motion.frosting.active) {
      motion.frosting.step(now)
      lightenKisses()
      moving = true
    }
    if (motion.glaze.active) {
      motion.glaze.step(now)
      moving = true
    }
    const group = root.current
    if (group && motion.reshape.active) {
      const e = easeOutSoft(motion.reshape.progress(now))
      const { across, up } = reshapeFrom.current
      group.scale.set(across + (1 - across) * e, up + (1 - up) * e, across + (1 - across) * e)
      moving = true
    }
    if (moving) invalidate()

    if (!sliceGroup.current) return
    const driven = controls?.current
    if (driven) {
      progress.current = driven.slice
    } else {
      const target = sliced ? 1 : 0
      progress.current = still
        ? target
        : THREE.MathUtils.damp(progress.current, target, 4.5, Math.min(delta, 0.05))
      if (Math.abs(progress.current - target) < 0.002) progress.current = target
      else invalidate()
    }
    placeSlice()

    const pouring = motion.pour.active
    const drips = driven ? Math.min(1, Math.max(0, driven.drips)) : pouring ? motion.pour.progress(now) : 1
    if (pouring) invalidate()
    const toppings = driven ? Math.min(1, Math.max(0, driven.toppings)) : 1
    const run = Math.max(0.001, pouring ? easeOutCubic(drips) : smooth(drips))
    for (const part of PARTS) {
      layout.tiers.forEach((tier, i) => {
        const d = dripGroups.current[`${part}${i}`]
        if (!d) return
        // Grow the glaze down from the tier's top edge.
        d.visible = drips > 0.01
        d.scale.y = run
        d.position.y = (tier.base + tier.height) * (1 - run)
      })
      const t = toppingGroups.current[part]
      if (t) {
        t.visible = toppings > 0.01
        t.position.y = (1 - settle(toppings)) * TOPPINGS_DROP
      }
    }
  })

  return (
    <CakeShownContext.Provider value={shown}>
      <group ref={root}>
        {PARTS.map((part) => (
          <group key={part} ref={part === 'slice' ? sliceGroup : undefined}>
            {layout.tiers.map((tier, i) => (
              <TierPiece
                key={`${i}-${tier.radius}`}
                tier={tier}
                part={part}
                material={materials.frosting}
                texture={textures[i]}
                faces={faces}
              />
            ))}
            {drip &&
              layout.tiers.map((tier, i) => (
                <group
                  key={`${i}-${tier.radius}`}
                  ref={(node) => void (dripGroups.current[`${part}${i}`] = node)}
                >
                  <GlazeCap tier={tier} part={part} material={materials.glaze} />
                  <Drips
                    drips={layout.drips.filter((d) => d.part === part && d.tier === i)}
                    material={materials.glaze}
                  />
                </group>
              ))}
            <group name="toppings" ref={(node) => void (toppingGroups.current[part] = node)}>
              <Toppings layout={layout} part={part} kissMaterial={materials.kiss} lit={lit} />
            </group>
          </group>
        ))}
        {config.message && <Plaque layout={layout} message={config.message} />}
      </group>
    </CakeShownContext.Provider>
  )
}
