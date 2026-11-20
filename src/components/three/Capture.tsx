'use client'

import { useThree } from '@react-three/fiber'
import type { EffectComposer as Composer } from 'postprocessing'
import { useEffect, type RefObject } from 'react'
import { useScene } from './theme'

/** Takes a square picture of the scene as a data URL, or null when the browser cannot. */
export type Capture = (size: number, type?: 'image/png' | 'image/jpeg', quality?: number) => string | null

/**
 * Gives the page a way to take a square picture of what the canvas shows. The frame is drawn again and copied
 * straight away, in the same task, so the canvas does not need `preserveDrawingBuffer`. When the scene has
 * post-processing, the frame goes through the composer, so the picture keeps the same tone mapping, bloom and
 * occlusion as the screen.
 */
export function CaptureBridge({
  captureRef,
  composerRef,
  drawRef,
  crop = 1,
}: {
  captureRef: RefObject<Capture | null>
  composerRef?: RefObject<Composer | null>
  /** Draws the frame instead, when set (photo mode puts the path-traced picture on the canvas). */
  drawRef?: RefObject<(() => void) | null>
  /** Part of the canvas's shorter side to keep, around the centre (1 = the largest centred square). */
  crop?: number
}) {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)
  const { sky: colours } = useScene()
  useEffect(() => {
    captureRef.current = (size, type = 'image/jpeg', quality = 0.86) => {
      const draw = drawRef?.current
      const composer = composerRef?.current
      if (draw) draw()
      else if (composer) composer.render(0)
      else gl.render(scene, camera)
      const source = gl.domElement
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      // The site's morning sky behind the transparent canvas, in the set in use: cream in the middle, the set's
      // sky colour at the edges.
      const sky = ctx.createRadialGradient(size / 2, size * 0.42, 0, size / 2, size / 2, size * 0.78)
      sky.addColorStop(0, colours.glow)
      sky.addColorStop(0.55, colours.bottom)
      sky.addColorStop(1, colours.top)
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, size, size)
      const side = Math.min(source.width, source.height) * crop
      ctx.drawImage(
        source,
        (source.width - side) / 2,
        (source.height - side) / 2,
        side,
        side,
        0,
        0,
        size,
        size,
      )
      try {
        return canvas.toDataURL(type, quality)
      } catch {
        return null
      }
    }
    return () => {
      captureRef.current = null
    }
  }, [gl, scene, camera, captureRef, composerRef, drawRef, crop, colours])
  return null
}
