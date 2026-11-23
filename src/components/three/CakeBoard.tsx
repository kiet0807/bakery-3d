'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useScene } from './theme'

const THICK = 0.055

/** A round cake board whose top sits at y = 0, for a cake of this radius that stands on no stand. */
export function CakeBoard({ radius }: { radius: number }) {
  const { porcelain } = useScene()
  const geometry = useMemo(() => {
    const rim = radius + 0.17
    const points = [
      [0, -THICK],
      [rim - 0.02, -THICK],
      [rim, -THICK * 0.7],
      [rim, -THICK * 0.3],
      [rim - 0.02, 0],
      [0, 0],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    return new THREE.LatheGeometry(points, 96)
  }, [radius])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial color={porcelain} roughness={0.3} clearcoat={0.6} clearcoatRoughness={0.2} />
    </mesh>
  )
}
