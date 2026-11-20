'use client'

import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  BLUEBERRY,
  CANDLE_STRIPES,
  CHERRY,
  DARK_CHOCOLATE,
  GOLD,
  LEAF,
  MACARON_COLORS,
  SPRINKLE_COLORS,
  STEM,
  STRAWBERRY,
} from '../palette'
import { useReducedMotionScene } from '../motion'
import { stripeTexture } from './geometry'
import type { CakeLayout, Part, Placement } from './layout'
import { glowTexture, shared } from './shared'
import { SCENE } from '../theme'

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
          <meshPhysicalMaterial color={BLUEBERRY} roughness={0.45} sheen={0.6} sheenColor="#b9c4ff" />
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
          <meshStandardMaterial color="#fff6e6" roughness={0.6} />
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

function Kisses({ list, color }: { list: Placement[]; color: string }) {
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
  return (
    <instancedMesh key={list.length} ref={ref} args={[g.kiss, undefined, list.length]} castShadow>
      <meshPhysicalMaterial color={color} roughness={0.6} sheen={0.4} sheenColor="#ffffff" />
    </instancedMesh>
  )
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

function Candle({ p, lit }: { p: Placement; lit: boolean }) {
  const g = shared()
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
        <meshStandardMaterial color={SCENE.candle.wick} />
      </mesh>
      {lit && (
        <group ref={flame} position-y={0.296}>
          <mesh geometry={g.flame}>
            <meshBasicMaterial color={SCENE.candle.flame} toneMapped={false} />
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

export function Toppings({
  layout,
  part,
  kissColor,
  lit = true,
}: {
  layout: CakeLayout
  part: Part
  kissColor: string
  lit?: boolean
}) {
  const kisses = useMemo(() => only(layout.ring['cream-kisses'], part), [layout, part])
  const sprinkles = useMemo(() => only(layout.sprinkles, part), [layout, part])
  return (
    <group>
      {only(layout.ring.strawberries, part).map((p, i) => (
        <Strawberry key={`s${i}`} p={p} />
      ))}
      {only(layout.ring.blueberries, part).map((p, i) => (
        <Blueberries key={`b${i}`} p={p} />
      ))}
      {only(layout.ring.macarons, part).map((p, i) => (
        <Macaron key={`m${i}`} p={p} />
      ))}
      {only(layout.ring.cherries, part).map((p, i) => (
        <Cherry key={`c${i}`} p={p} />
      ))}
      {only(layout.ring['chocolate-shards'], part).map((p, i) => (
        <Shard key={`h${i}`} p={p} />
      ))}
      {only(layout.goldLeaf, part).map((p, i) => (
        <GoldLeaf key={`g${i}`} p={p} />
      ))}
      {only(layout.candles, part).map((p) => (
        <Candle key={`k${p.variant}`} p={p} lit={lit} />
      ))}
      <Kisses list={kisses} color={kissColor} />
      <Sprinkles list={sprinkles} />
    </group>
  )
}
