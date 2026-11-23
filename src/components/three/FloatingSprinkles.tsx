'use client'

import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createRandom } from '@/lib/random'
import { shared } from './cake/shared'
import { useReducedMotionScene } from './motion'
import { SPRINKLE_COLORS } from './palette'
import { useScene } from './theme'

/** Sprinkles drifting up through the morning air, like confetti that forgot to fall. */
export function FloatingSprinkles({
  count = 90,
  spread = 9,
  height = 7,
}: {
  count?: number
  spread?: number
  height?: number
}) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const still = useReducedMotionScene()
  const { sprinkleGlow } = useScene()
  const seeds = useMemo(() => {
    const random = createRandom(7)
    return Array.from({ length: count }, () => ({
      x: (random() - 0.5) * spread,
      y: random() * height,
      z: -random() * spread * 0.7 + 1,
      speed: 0.06 + random() * 0.16,
      spin: (random() - 0.5) * 2,
      phase: random() * Math.PI * 2,
      color: SPRINKLE_COLORS[Math.floor(random() * SPRINKLE_COLORS.length)],
    }))
  }, [count, spread, height])
  useLayoutEffect(() => {
    const instanced = mesh.current
    if (!instanced) return
    const color = new THREE.Color()
    seeds.forEach((s, i) => instanced.setColorAt(i, color.set(s.color)))
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true
  }, [seeds])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const placed = useRef<object | null>(null)
  useFrame(({ clock }) => {
    const instanced = mesh.current
    // Asked for less motion: placed once, then left alone.
    if (!instanced || (still && placed.current === seeds)) return
    placed.current = seeds
    const t = still ? 0 : clock.elapsedTime
    seeds.forEach((s, i) => {
      const y = ((s.y + t * s.speed) % height) - height * 0.35
      dummy.position.set(s.x + Math.sin(t * 0.4 + s.phase) * 0.2, y, s.z)
      dummy.rotation.set(s.phase + t * s.spin, s.phase, t * s.spin * 0.6)
      dummy.scale.setScalar(2.2)
      dummy.updateMatrix()
      instanced.setMatrixAt(i, dummy.matrix)
    })
    instanced.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[shared().sprinkle, undefined, count]} frustumCulled={false}>
      <meshStandardMaterial roughness={0.45} emissive={sprinkleGlow} emissiveIntensity={0.08} />
    </instancedMesh>
  )
}
