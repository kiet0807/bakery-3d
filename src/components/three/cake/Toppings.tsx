'use client'

import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import {
  BLUEBERRY,
  BLUEBERRY_SHEEN,
  CANDLE_STRIPES,
  CHERRY,
  DARK_CHOCOLATE,
  GOLD,
  LEAF,
  MACARON_COLORS,
  MACARON_CREAM,
  SPRINKLE_COLORS,
  STEM,
  STRAWBERRY,
} from '../palette'
import { useQuality, useReducedMotionScene } from '../motion'
import { Arrival, Glide, placementSig } from './Arrival'
import { stripeTexture } from './geometry'
import type { CakeLayout, Part, Placement } from './layout'
import { glowTexture, shared } from './shared'
import { CANDLE } from '../theme'

const only = (list: Placement[], part: Part) => list.filter((p) => p.part === part)

function Strawberry({ p }: { p: Placement }) {
  const g = shared()
  return (
    <group position={[p.x, p.y - 0.02, p.z]} rotation-y={p.yaw} scale={p.scale}>
      <mesh geometry={g.strawberry} castShadow>
        <meshPhysicalMaterial color={STRAWBERRY} roughness={0.32} clearcoat={0.7} clearcoatRoughness={0.25} />
      </mesh>
      <mesh geometry={g.calyx} position-y={0.172}>
        <meshStandardMaterial color={LEAF} roughness={0.6} />
      </mesh>
    </group>
  )
}

const BERRY_CLUSTER: [number, number, number][] = [
  [0, 0.034, 0],
  [0.058, 0.034, 0.018],
  [0.022, 0.034, 0.056],
]

function Blueberries({ p }: { p: Placement }) {
  const g = shared()
  return (
    <group position={[p.x, p.y, p.z]} rotation-y={p.yaw} scale={p.scale}>
      {BERRY_CLUSTER.map((offset, i) => (
        <mesh key={i} geometry={g.blueberry} position={offset} castShadow>
          <meshPhysicalMaterial color={BLUEBERRY} roughness={0.45} sheen={0.6} sheenColor={BLUEBERRY_SHEEN} />
        </mesh>
      ))}
    </group>
  )
}

function Macaron({ p }: { p: Placement }) {
  const g = shared()
  const color = MACARON_COLORS[p.variant % MACARON_COLORS.length]
  return (
    <group position={[p.x, p.y, p.z]} rotation-y={p.yaw} scale={p.scale}>
      <group position-y={0.08} rotation-x={Math.PI / 2 - p.tilt}>
        <mesh geometry={g.macaronShell} position-y={0.026} castShadow>
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        <mesh geometry={g.macaronFilling}>
          <meshStandardMaterial color={MACARON_CREAM} roughness={0.6} />
        </mesh>
        <mesh geometry={g.macaronShell} position-y={-0.026} castShadow>
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      </group>
    </group>
  )
}

function Cherry({ p }: { p: Placement }) {
  const g = shared()
  return (
    <group position={[p.x, p.y, p.z]} rotation-y={p.yaw} scale={p.scale}>
      <mesh geometry={g.cherry} position-y={0.05} castShadow>
        <meshPhysicalMaterial color={CHERRY} roughness={0.15} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>
      <mesh geometry={g.stem}>
        <meshStandardMaterial color={STEM} roughness={0.7} />
      </mesh>
    </group>
  )
}

function Shard({ p }: { p: Placement }) {
  const g = shared()
  return (
    <group position={[p.x, p.y - 0.025, p.z]} rotation-y={p.yaw} scale={p.scale}>
      <mesh geometry={g.shards[p.variant % g.shards.length]} rotation-x={p.tilt} castShadow>
        <meshPhysicalMaterial color={DARK_CHOCOLATE} roughness={0.35} clearcoat={0.4} />
      </mesh>
    </group>
  )
}

function Kisses({ list, material }: { list: Placement[]; material: THREE.Material }) {
  const g = shared()
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    list.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z)
      dummy.rotation.set(0, p.yaw, 0)
      dummy.scale.setScalar(p.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [list])
  if (!list.length) return null
  return <instancedMesh key={list.length} ref={ref} args={[g.kiss, material, list.length]} castShadow />
}

function Sprinkles({ list }: { list: Placement[] }) {
  const g = shared()
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    const color = new THREE.Color()
    list.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z)
      dummy.rotation.set(0, p.yaw, Math.PI / 2)
      dummy.scale.setScalar(p.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, color.set(SPRINKLE_COLORS[p.variant % SPRINKLE_COLORS.length]))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [list])
  if (!list.length) return null
  return (
    <instancedMesh key={list.length} ref={ref} args={[g.sprinkle, undefined, list.length]}>
      <meshStandardMaterial roughness={0.45} />
    </instancedMesh>
  )
}

function GoldLeaf({ p }: { p: Placement }) {
  const g = shared()
  return (
    <mesh
      geometry={g.flakes[p.variant % g.flakes.length]}
      position={[p.x, p.y, p.z]}
      rotation={p.tilt ? [0, p.yaw, p.variant * 0.7] : [-Math.PI / 2, 0, p.yaw]}
      scale={p.scale}
    >
      {/* Mostly metal, with a little of its own glow so it never turns black away from the light. */}
      <meshStandardMaterial
        color={GOLD}
        metalness={0.75}
        roughness={0.3}
        emissive={GOLD}
        emissiveIntensity={0.18}
        envMapIntensity={1.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

/** The flame in high dynamic range: well over the high tier's bloom threshold (BLOOM_FROM in Effects). */
const FLAME_HDR = new THREE.Color(CANDLE.flame).multiplyScalar(6)

function Candle({ p, lit }: { p: Placement; lit: boolean }) {
  const g = shared()
  // The light tier has no bloom and would clip the bright flame to white: it keeps the plain colour.
  const high = useQuality() === 'high'
  const flame = useRef<THREE.Group>(null)
  const still = useReducedMotionScene()
  const stripes = CANDLE_STRIPES[p.variant % CANDLE_STRIPES.length]
  const texture = useMemo(() => stripeTexture(stripes), [stripes])
  const glow = useMemo(() => glowTexture(), [])
  useFrame(({ clock }) => {
    if (!flame.current || still || !lit) return
    const t = clock.elapsedTime * 9 + p.variant * 1.7
    const flicker = 1 + Math.sin(t) * 0.07 + Math.sin(t * 2.3) * 0.05
    flame.current.scale.set(1 / flicker, flicker, 1 / flicker)
    flame.current.rotation.z = Math.sin(t * 0.7) * 0.06
  })
  return (
    <group position={[p.x, p.y, p.z]} scale={p.scale}>
      <mesh geometry={g.candle} position-y={0.12} castShadow>
        <meshStandardMaterial map={texture} roughness={0.5} />
      </mesh>
      <mesh geometry={g.wick} position-y={0.285}>
        <meshStandardMaterial color={CANDLE.wick} />
      </mesh>
      {lit && (
        <group ref={flame} position-y={0.296}>
          <mesh geometry={g.flame}>
            <meshBasicMaterial color={high ? FLAME_HDR : CANDLE.flame} toneMapped={false} />
          </mesh>
          {glow && (
            <sprite position-y={0.035} scale={0.2}>
              <spriteMaterial
                map={glow}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                transparent
                toneMapped={false}
              />
            </sprite>
          )}
        </group>
      )}
    </group>
  )
}

/** Gap between two pieces of a ring landing; long rings close up, so a whole ring lands within 0.3 s. */
const gapFor = (count: number) => Math.min(45, 300 / Math.max(1, count))

/** The landing each piece of a list last made (its `sig` and `delay`), by key, and the list it was made for. */
interface Landed {
  sig: string
  pieces: Map<number, { sig: string; delay: number }>
}

function landedFor(list: Placement[], sig: string, slide: boolean, before?: Landed): Landed {
  const gap = gapFor(list.length)
  const pieces = new Map<number, { sig: string; delay: number }>()
  let fresh = 0
  list.forEach((p, i) => {
    const kept = slide ? before?.pieces.get(p.variant) : undefined
    if (kept) pieces.set(p.variant, kept)
    else pieces.set(slide ? p.variant : i, { sig, delay: (slide ? fresh++ : i) * gap })
  })
  return { sig, pieces }
}

/**
 * A list of pieces that land one after another, in ring order, whenever they appear or move. With `slide` (pieces
 * that are added one at a time, keyed by `variant`) the ones already there slide to their new places instead, and
 * only the new ones land.
 */
function Landing({
  list,
  height,
  slide = false,
  render,
}: {
  list: Placement[]
  height?: number
  slide?: boolean
  render: (p: Placement) => ReactNode
}) {
  const sig = placementSig(list)
  const [landed, setLanded] = useState(() => landedFor(list, sig, slide))
  let now = landed
  if (landed.sig !== sig) {
    now = landedFor(list, sig, slide, landed)
    setLanded(now)
  }
  return list.map((p, i) => {
    const key = slide ? p.variant : i
    const piece = now.pieces.get(key) ?? { sig, delay: 0 }
    return (
      <Arrival key={key} sig={piece.sig} delay={piece.delay} height={height}>
        {slide ? (
          <Glide x={p.x} z={p.z}>
            {render(p)}
          </Glide>
        ) : (
          render(p)
        )}
      </Arrival>
    )
  })
}

export function Toppings({
  layout,
  part,
  kissMaterial,
  lit = true,
}: {
  layout: CakeLayout
  part: Part
  /** Shared with the cake, which eases its colour along with the frosting. */
  kissMaterial: THREE.Material
  lit?: boolean
}) {
  const kisses = useMemo(() => only(layout.ring['cream-kisses'], part), [layout, part])
  const sprinkles = useMemo(() => only(layout.sprinkles, part), [layout, part])
  return (
    <group>
      <Landing list={only(layout.ring.strawberries, part)} render={(p) => <Strawberry p={p} />} />
      <Landing list={only(layout.ring.blueberries, part)} render={(p) => <Blueberries p={p} />} />
      <Landing list={only(layout.ring.macarons, part)} render={(p) => <Macaron p={p} />} />
      <Landing list={only(layout.ring.cherries, part)} render={(p) => <Cherry p={p} />} />
      <Landing list={only(layout.ring['chocolate-shards'], part)} render={(p) => <Shard p={p} />} />
      <Landing list={only(layout.goldLeaf, part)} height={0.22} render={(p) => <GoldLeaf p={p} />} />
      <Landing
        list={only(layout.candles, part)}
        height={0.4}
        slide
        render={(p) => <Candle p={p} lit={lit} />}
      />
      <Arrival sig={placementSig(kisses)} height={0.2}>
        <Kisses list={kisses} material={kissMaterial} />
      </Arrival>
      <Arrival sig={placementSig(sprinkles)} height={0.45}>
        <Sprinkles list={sprinkles} />
      </Arrival>
    </group>
  )
}
