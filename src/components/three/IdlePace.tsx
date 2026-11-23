'use client'

import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { useReducedMotionScene } from './motion'

/**
 * Frames a second for motion nobody started: a cake turning on show, candle flames, the tied box. Half of what a
 * screen shows reads as smooth at that pace and costs half the battery.
 */
const IDLE_FPS = 30

/** Draws idle motion at IDLE_FPS, in step with the screen's refresh. Off under reduced motion: nothing idles. */
export function IdlePace() {
  const invalidate = useThree((state) => state.invalidate)
  const still = useReducedMotionScene()
  useEffect(() => {
    if (still) return
    const interval = 1000 / IDLE_FPS
    let last = 0
    let frame = requestAnimationFrame(function tick(now) {
      // A few milliseconds of slack, so a 60 Hz screen draws every second refresh rather than every third.
      if (now - last >= interval - 4) {
        last = now
        invalidate()
      }
      frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [still, invalidate])
  return null
}
