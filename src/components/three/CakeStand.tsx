'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useScene } from './theme'
import { useEasedSize } from './useEasedSize'

export const STAND_HEIGHT = 0.66

/** The stand's profile, turned on a lathe: the plate is sized for a cake of this radius. */
function standGeometry(radius: number) {
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
}

/**
 * A porcelain cake stand whose plate top sits at y = 0. When the cake changes size the plate grows or shrinks
 * with it (the foot stays), rebuilt each frame of the change: a lathe of 1 440 points costs next to nothing.
 */
export function CakeStand({ radius }: { radius: number }) {
  const { porcelain } = useScene()
  const mesh = useRef<THREE.Mesh>(null)
  const [first] = useState(() => standGeometry(radius))
  const builtFor = useRef(radius)
  useEasedSize(radius, (size) => {
    const stand = mesh.current
    if (!stand || size === builtFor.current) return
    builtFor.current = size
    const built = stand.geometry
    stand.geometry = standGeometry(size)
    built.dispose()
  })
  useEffect(() => {
    const stand = mesh.current
    return () => stand?.geometry.dispose()
  }, [])
  return (
    <mesh ref={mesh} geometry={first} receiveShadow castShadow>
      <meshPhysicalMaterial color={porcelain} roughness={0.22} clearcoat={0.8} clearcoatRoughness={0.15} />
    </mesh>
  )
}
