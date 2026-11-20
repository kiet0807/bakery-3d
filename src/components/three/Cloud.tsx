'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createRandom } from '@/lib/random'

const sphere = new THREE.SphereGeometry(1, 28, 18)

export interface CloudProps {
  seed: number
  puffs?: number
  /** Half sizes of the cloud. */
  width?: number
  height?: number
  depth?: number
  color?: string
  position?: [number, number, number]
  scale?: number
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
  color = '#d8d9ec',
  position,
  scale = 1,
}: CloudProps) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const items = useMemo(() => {
    const random = createRandom(seed)
    return Array.from({ length: puffs }, () => {
      const angle = random() * Math.PI * 2
      const reach = Math.sqrt(random())
      const x = Math.cos(angle) * reach * width
      const z = Math.sin(angle) * reach * depth
      const centre = 1 - reach * 0.75
      const radius = (0.32 + random() * 0.38) * (0.55 + centre * 0.6) * Math.min(width, 1.6)
      const y = random() * height * centre
      return { x, y: Math.max(y, radius * 0.25), z, radius }
    })
  }, [seed, puffs, width, height, depth])

  useLayoutEffect(() => {
    const instanced = mesh.current
    if (!instanced) return
    const dummy = new THREE.Object3D()
    items.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z)
      dummy.scale.set(p.radius, p.radius * 0.82, p.radius)
      dummy.updateMatrix()
      instanced.setMatrixAt(i, dummy.matrix)
    })
    instanced.instanceMatrix.needsUpdate = true
    instanced.computeBoundingSphere()
  }, [items])

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
        color={color}
        roughness={1}
        sheen={0.6}
        sheenColor="#cfe6ff"
        sheenRoughness={0.8}
      />
    </instancedMesh>
  )
}
