'use client'

import { Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { dripOf, fillingOf, frostingOf, spongeOf, type CakeConfig } from '@/lib/cake'
import { MILK_CHOCOLATE } from '../palette'
import { BEVEL, FROSTING, SLICE_ANGLE, cutFace, cutFaceTexture, faceRotation, tierSurface } from './geometry'
import { computeLayout, type CakeLayout, type Drip, type Part, type TierLayout } from './layout'
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
  frosting,
  texture,
}: {
  tier: TierLayout
  part: Part
  frosting: string
  texture: THREE.Texture | null
}) {
  const [start, length] = RANGES[part]
  const surface = useMemo(
    () => tierSurface(tier.radius, tier.height, start, length),
    [tier.radius, tier.height, start, length],
  )
  const face = useMemo(() => cutFace(tier.radius, tier.height), [tier.radius, tier.height])
  useEffect(() => () => surface.dispose(), [surface])
  useEffect(() => () => face.dispose(), [face])
  const bump = useMemo(() => buttercreamTexture(), [])

  return (
    <group position-y={tier.base}>
      <mesh geometry={surface} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={frosting}
          roughness={0.58}
          bumpMap={bump}
          bumpScale={1.4}
          sheen={0.6}
          sheenColor="#ffffff"
          sheenRoughness={0.5}
        />
      </mesh>
      {[HALF, -HALF].map((phi) => (
        <mesh key={phi} geometry={face} rotation-y={faceRotation(phi)} receiveShadow>
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

function GlazeCap({ tier, part, color }: { tier: TierLayout; part: Part; color: string }) {
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
  return (
    <mesh geometry={geometry} position-y={tier.base} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} roughness={0.16} clearcoat={1} clearcoatRoughness={0.1} />
    </mesh>
  )
}

function Drips({ drips, color }: { drips: Drip[]; color: string }) {
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
      <instancedMesh ref={columns} args={[g.dripColumn, undefined, drips.length]} castShadow>
        <meshPhysicalMaterial color={color} roughness={0.16} clearcoat={1} clearcoatRoughness={0.1} />
      </instancedMesh>
      <instancedMesh ref={bulbs} args={[g.dripBulb, undefined, drips.length]} castShadow>
        <meshPhysicalMaterial color={color} roughness={0.16} clearcoat={1} clearcoatRoughness={0.1} />
      </instancedMesh>
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
  const height = 0.27 * scale
  // Long messages on small plaques shrink until they fit inside the chocolate, instead of spilling over it.
  const fit = (text: SyncedText) => {
    const bounds = text.textRenderInfo?.blockBounds
    if (!bounds) return
    const [x0, y0, x1, y1] = bounds
    const k = Math.min(1, (width * 0.9) / Math.max(1e-6, x1 - x0), (height * 0.84) / Math.max(1e-6, y1 - y0))
    text.scale.setScalar(k)
  }
  return (
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
          fontSize={0.072 * scale}
          maxWidth={width * 0.9}
          onSync={fit}
          lineHeight={1.05}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          position={[0, 0.006, 0.0135]}
          color="#fff3df"
        >
          {message}
        </Text>
      </Suspense>
    </group>
  )
}

const smooth = (t: number) => t * t * (3 - 2 * t)
const settle = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * A whole cake built from a design. The body and the slice are separate pieces that fit together, so
 * "slicing" is only a matter of moving the slice away. A scene can also drive the slice, the drips and the
 * toppings directly through `controls` (the scroll story does).
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
  const kissColor = useMemo(
    () => `#${new THREE.Color(frosting).lerp(new THREE.Color('#ffffff'), 0.55).getHexString()}`,
    [frosting],
  )
  const textures = useMemo(
    () =>
      layout.tiers.map((tier, i) =>
        cutFaceTexture({
          radius: tier.radius,
          height: tier.height,
          sponge,
          filling,
          frosting,
          seed: layout.seed + i,
        }),
      ),
    [layout, sponge, filling, frosting],
  )
  useEffect(() => () => textures.forEach((t) => t?.dispose()), [textures])

  const sliceGroup = useRef<THREE.Group>(null)
  const dripGroups = useRef<Partial<Record<Part, THREE.Group | null>>>({})
  const toppingGroups = useRef<Partial<Record<Part, THREE.Group | null>>>({})
  const progress = useRef(sliced ? 1 : 0)
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => invalidate(), [sliced, invalidate])

  useFrame((_, delta) => {
    const group = sliceGroup.current
    if (!group) return
    const driven = controls?.current
    if (driven) {
      progress.current = driven.slice
    } else {
      const target = sliced ? 1 : 0
      progress.current = THREE.MathUtils.damp(progress.current, target, 4.5, Math.min(delta, 0.05))
      if (Math.abs(progress.current - target) < 0.002) progress.current = target
      else invalidate()
    }
    const ease = smooth(Math.min(1, Math.max(0, progress.current)))
    const reach = ease * layout.maxRadius * sliceReach
    group.position.set(Math.sin(sliceAngle) * reach, ease * 0.12, Math.cos(sliceAngle) * reach)
    group.rotation.y = ease * sliceTurn

    const drips = driven ? Math.min(1, Math.max(0, driven.drips)) : 1
    const toppings = driven ? Math.min(1, Math.max(0, driven.toppings)) : 1
    for (const part of PARTS) {
      const d = dripGroups.current[part]
      if (d) {
        // Grow the glaze down from the top edge.
        d.visible = drips > 0.01
        d.scale.y = Math.max(0.001, smooth(drips))
        d.position.y = layout.topY * (1 - d.scale.y)
      }
      const t = toppingGroups.current[part]
      if (t) {
        t.visible = toppings > 0.01
        t.position.y = (1 - settle(toppings)) * 1.4
      }
    }
  })

  return (
    <group>
      {PARTS.map((part) => (
        <group key={part} ref={part === 'slice' ? sliceGroup : undefined}>
          {layout.tiers.map((tier, i) => (
            <TierPiece
              key={`${i}-${tier.radius}`}
              tier={tier}
              part={part}
              frosting={frosting}
              texture={textures[i]}
            />
          ))}
          {drip && (
            <group ref={(node) => void (dripGroups.current[part] = node)}>
              {layout.tiers.map((tier, i) => (
                <GlazeCap key={`${i}-${tier.radius}`} tier={tier} part={part} color={drip} />
              ))}
              <Drips drips={layout.drips.filter((d) => d.part === part)} color={drip} />
            </group>
          )}
          <group ref={(node) => void (toppingGroups.current[part] = node)}>
            <Toppings layout={layout} part={part} kissColor={kissColor} lit={lit} />
          </group>
        </group>
      ))}
      {config.message && <Plaque layout={layout} message={config.message} />}
    </group>
  )
}
