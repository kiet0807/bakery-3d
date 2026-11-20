'use client'

import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef, useState } from 'react'
import { useReducedMotionScene } from './motion'
import { RESHAPE_MS, Timeline, easeOutSoft, useSettler } from './tween'

/**
 * Follows a size (a radius) that changes with the cake, easing from the old value to the new one on the same
 * curve and time as the cake's own reshape, so the stand and its shadow grow with the cake. `apply` receives
 * the size on screen: once at once, then every frame while it moves.
 */
export function useEasedSize(value: number, apply: (size: number) => void) {
  const still = useReducedMotionScene()
  const settler = useSettler()
  const [timeline] = useState(() => new Timeline())
  const shown = useRef<number | null>(null)
  const from = useRef(value)
  const latest = useRef(apply)
  useLayoutEffect(() => {
    latest.current = apply
  })

  useLayoutEffect(() => {
    const current = shown.current
    if (current === null || still || current === value) {
      shown.current = value
      latest.current(value)
      return
    }
    from.current = current
    timeline.play(RESHAPE_MS)
    return settler.add(() => {
      timeline.finish()
      shown.current = value
      latest.current(value)
    })
  }, [value, still, settler, timeline])

  useFrame(() => {
    if (!timeline.active) return
    const size = from.current + (value - from.current) * easeOutSoft(timeline.progress())
    shown.current = size
    latest.current(size)
  })
}
