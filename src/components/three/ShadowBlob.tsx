'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useScene } from './theme'

let texture: THREE.CanvasTexture | null = null

/**
 * One soft round shadow, painted once in white and shared by every blob on the page. The material tints it with
 * the set's ink, so a palette change is a colour change, not a new texture.
 */
function blobTexture() {
  if (texture) return texture
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.42)')
  gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.26)')
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.08)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/**
 * A soft round shadow on the floor under a cake stand. Used instead of ContactShadows where the scene has
 * post-processing: ContactShadows' square plane shows through the effect chain as a hard horizon line, while
 * this fades to nothing at its edge. It also costs nothing per frame.
 */
export function ShadowBlob({ radius, y, opacity = 1 }: { radius: number; y: number; opacity?: number }) {
  const map = useMemo(() => blobTexture(), [])
  // Brand ink, thinned: on a cream page a soft green-grey shadow looks like daylight, black looks like a hole.
  const { ink } = useScene()
  const geometry = useMemo(() => new THREE.PlaneGeometry(radius * 2, radius * 2), [radius])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh
      geometry={geometry}
      position-y={y + 0.003}
      rotation-x={-Math.PI / 2}
      renderOrder={1}
      // The path-traced photo casts real shadows on its own floor.
      userData={{ noPhoto: true }}
    >
      <meshBasicMaterial
        map={map}
        color={ink}
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}
