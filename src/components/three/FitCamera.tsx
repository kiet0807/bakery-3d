'use client'

import { useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import * as THREE from 'three'

export interface FitCameraProps {
  /** Half the width that must stay in view. */
  radius: number
  /** Full height that must stay in view. */
  height: number
  /** Point the camera looks at. */
  center?: [number, number, number]
  /** Angle above the horizon, in degrees. */
  elevation?: number
  /** Extra room around the subject (1 = tight). */
  margin?: number
}

/**
 * Places the camera so the subject fits whatever the shape of the canvas: a wide desktop hero or a tall
 * phone screen. Re-runs when the canvas is resized.
 */
export function FitCamera({
  radius,
  height,
  center = [0, 0, 0],
  elevation = 14,
  margin = 1.12,
}: FitCameraProps) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const invalidate = useThree((state) => state.invalidate)
  const [cx, cy, cz] = center
  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera) || size.height === 0) return
    const aspect = size.width / size.height
    const vertical = THREE.MathUtils.degToRad(camera.fov)
    const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * aspect)
    const distance =
      Math.max(height / 2 / Math.tan(vertical / 2), radius / Math.tan(horizontal / 2)) * margin + radius * 0.5
    const angle = THREE.MathUtils.degToRad(elevation)
    camera.position.set(cx, cy + Math.sin(angle) * distance, cz + Math.cos(angle) * distance)
    camera.lookAt(cx, cy, cz)
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, size, radius, height, cx, cy, cz, elevation, margin, invalidate])
  return null
}
