'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { SCENE } from './theme'

export const STAND_HEIGHT = 0.66

/** A porcelain cake stand whose plate top sits at y = 0. */
export function CakeStand({ radius }: { radius: number }) {
  const geometry = useMemo(() => {
    const plate = radius + 0.3
    const points = [
      [0, -STAND_HEIGHT],
      [0.56, -STAND_HEIGHT],
      [0.6, -STAND_HEIGHT + 0.025],
      [0.57, -STAND_HEIGHT + 0.055],
      [0.22, -0.58],
      [0.12, -0.5],
      [0.1, -0.32],
      [0.12, -0.16],
      [0.32, -0.085],
      [plate - 0.05, -0.068],
      [plate - 0.005, -0.045],
      [plate + 0.012, -0.012],
      [plate - 0.012, 0.014],
      [plate - 0.06, 0.002],
      [0, 0],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    return new THREE.LatheGeometry(points, 96)
  }, [radius])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh geometry={geometry} receiveShadow castShadow>
      <meshPhysicalMaterial
        color={SCENE.porcelain}
        roughness={0.22}
        clearcoat={0.8}
        clearcoatRoughness={0.15}
      />
    </mesh>
  )
}
