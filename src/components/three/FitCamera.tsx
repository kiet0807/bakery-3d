'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useReducedMotionScene } from './motion'
import { RESHAPE_MS, Timeline, easeOutCubic, useSettler } from './tween'

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
  /**
   * When the subject changes size (not when the canvas does), glide to the new framing instead of jumping, keeping
   * the angle the visitor turned the camera to. Needs default OrbitControls (`makeDefault`), whose target it moves.
   */
  glide?: boolean
}

/** The parts of OrbitControls this needs. */
interface Orbit {
  target: THREE.Vector3
  addEventListener: (type: 'start', listener: () => void) => void
  removeEventListener: (type: 'start', listener: () => void) => void
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
  glide = false,
}: FitCameraProps) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const invalidate = useThree((state) => state.invalidate)
  const controls = useThree((state) => state.controls) as unknown as Orbit | null
  const still = useReducedMotionScene()
  const settler = useSettler()
  const [cx, cy, cz] = center
  const fitted = useRef<{ width: number; height: number } | null>(null)
  const [timeline] = useState(() => new Timeline())
  const [path] = useState(() => ({
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3(),
    fromDistance: 1,
    toDistance: 1,
  }))

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera) || size.height === 0) return
    const aspect = size.width / size.height
    const vertical = THREE.MathUtils.degToRad(camera.fov)
    const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * aspect)
    const distance =
      Math.max(height / 2 / Math.tan(vertical / 2), radius / Math.tan(horizontal / 2)) * margin + radius * 0.5
    const sameCanvas = fitted.current?.width === size.width && fitted.current?.height === size.height
    fitted.current = { width: size.width, height: size.height }

    if (glide && sameCanvas && controls && !still) {
      // Glide from wherever the camera is now (it may be mid-glide) to the new framing, around the same angle.
      path.fromTarget.copy(controls.target)
      path.toTarget.set(cx, cy, cz)
      path.fromDistance = camera.position.distanceTo(controls.target)
      path.toDistance = distance
      timeline.play(RESHAPE_MS)
      invalidate()
      // Only a glide still under way is finished: after it, the camera is the visitor's to turn and zoom.
      const land = () => {
        if (!timeline.active) return
        timeline.finish()
        place(1)
      }
      return settler.add(land)
    }

    timeline.finish()
    const angle = THREE.MathUtils.degToRad(elevation)
    camera.position.set(cx, cy + Math.sin(angle) * distance, cz + Math.cos(angle) * distance)
    camera.lookAt(cx, cy, cz)
    controls?.target.set(cx, cy, cz)
    camera.updateProjectionMatrix()
    invalidate()
    // `place` reads only refs and stable objects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    camera,
    size,
    radius,
    height,
    cx,
    cy,
    cz,
    elevation,
    margin,
    invalidate,
    glide,
    controls,
    still,
    settler,
  ])

  // Dragging the camera takes over from a glide in progress.
  useLayoutEffect(() => {
    if (!controls) return
    const stop = () => timeline.finish()
    controls.addEventListener('start', stop)
    return () => controls.removeEventListener('start', stop)
  }, [controls, timeline])

  const offset = useRef(new THREE.Vector3())
  /** Puts the camera `t` of the way along the glide, keeping its direction from the target. */
  function place(t: number) {
    if (!controls) return
    const e = easeOutCubic(t)
    offset.current.subVectors(camera.position, controls.target)
    controls.target.lerpVectors(path.fromTarget, path.toTarget, e)
    offset.current.setLength(THREE.MathUtils.lerp(path.fromDistance, path.toDistance, e))
    camera.position.copy(controls.target).add(offset.current)
    camera.lookAt(controls.target)
  }

  useFrame(() => {
    if (!timeline.active) return
    place(timeline.progress())
    invalidate()
  })
  return null
}
