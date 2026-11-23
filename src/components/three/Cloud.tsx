'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createRandom } from '@/lib/random'
import { useScene } from './theme'

const sphere = new THREE.SphereGeometry(1, 28, 18)
/** Puffs are a little wider than tall. */
const FLATTEN = 0.82
/**
 * Light of their own, so the undersides (lit only by the mint bounce from below) stay cream-white instead of
 * turning grey-green, most visibly on the light tier, which has no café HDRI to fill them.
 */
const CLOUD_GLOW = 0.3
/** How far the lowest puffs lean to the cloud's shade colour: on a cream page a white cloud has no edge of its own. */
const SHADE = 0.85

export interface CloudProps {
  seed: number
  puffs?: number
  /** Half sizes of the cloud. */
  width?: number
  height?: number
  depth?: number
  /** Defaults to the set's near-cloud white. */
  color?: string
  position?: [number, number, number]
  scale?: number
  /**
   * Something round rests on the cloud: no puff rises above `y` (in the cloud's own units) within `radius` of the
   * middle, and the ones around it climb from there only behind it, so the cloud never hides what it carries.
   */
  rest?: { radius: number; y: number }
}

/**
 * A cumulus cloud made of overlapping spheres: big ones in the middle, small ones at the edges, and a flat
 * underside like the real thing. One draw call per cloud.
 */
export function Cloud({
  seed,
  puffs = 26,
  width = 1.8,
  height = 0.5,
  depth = 1.2,
  color,
  position,
  scale = 1,
  rest,
}: CloudProps) {
  const { cloud } = useScene()
  const near = color ?? cloud.near
  const { shade } = cloud
  const mesh = useRef<THREE.InstancedMesh>(null)
  const restRadius = rest?.radius
  const restY = rest?.y
  const items = useMemo(() => {
    const random = createRandom(seed)
    const puffsAt = Array.from({ length: puffs }, () => {
      const angle = random() * Math.PI * 2
      const reach = Math.sqrt(random())
      const x = Math.cos(angle) * reach * width
      const z = Math.sin(angle) * reach * depth
      const centre = 1 - reach * 0.75
      const radius = (0.32 + random() * 0.38) * (0.55 + centre * 0.6) * Math.min(width, 1.6)
      const y = random() * height * centre
      return { x, y: Math.max(y, radius * 0.25), z, radius }
    })
    if (restRadius !== undefined && restY !== undefined)
      for (const puff of puffsAt) {
        // Well behind what rests here the cloud may climb a little; beneath, beside and in front it stays below.
        const beyond = Math.max(0, Math.hypot(puff.x, puff.z) - restRadius)
        const ceiling = restY + Math.min(beyond, Math.max(0, -puff.z - 0.8)) * 0.6
        puff.y = Math.min(puff.y, ceiling - puff.radius * FLATTEN)
      }
    return puffsAt
  }, [seed, puffs, width, height, depth, restRadius, restY])

  useLayoutEffect(() => {
    const instanced = mesh.current
    if (!instanced) return
    const dummy = new THREE.Object3D()
    const tint = new THREE.Color()
    const base = new THREE.Color(near)
    const low = new THREE.Color(shade)
    const tops = items.map((p) => p.y + p.radius * FLATTEN)
    const [bottom, top] = [Math.min(...tops), Math.max(...tops)]
    items.forEach((p, i) => {
      instanced.setColorAt(
        i,
        tint.copy(base).lerp(low, SHADE * (1 - (tops[i] - bottom) / (top - bottom || 1))),
      )
      dummy.position.set(p.x, p.y, p.z)
      dummy.scale.set(p.radius, p.radius * FLATTEN, p.radius)
      dummy.updateMatrix()
      instanced.setMatrixAt(i, dummy.matrix)
    })
    instanced.instanceMatrix.needsUpdate = true
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true
    instanced.computeBoundingSphere()
  }, [items, near, shade])

  return (
    <instancedMesh
      ref={mesh}
      args={[sphere, undefined, items.length]}
      position={position}
      scale={scale}
      castShadow
      receiveShadow
    >
      <meshPhysicalMaterial
        emissive={cloud.glow}
        emissiveIntensity={CLOUD_GLOW}
        roughness={1}
        sheen={0.7}
        sheenColor={cloud.sheen}
        sheenRoughness={0.8}
      />
    </instancedMesh>
  )
}
