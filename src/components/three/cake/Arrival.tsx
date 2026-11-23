'use client'

import { useFrame, useThree } from '@react-three/fiber'
import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import type * as THREE from 'three'
import { useReducedMotionScene } from '../motion'
import { ARRIVE_MS, Timeline, easeOutSoft, useSettler } from '../tween'

/**
 * True once the cake has been on screen. Pieces that appear after that (a topping just chosen, a candle added,
 * the plaque when the first letter is typed) drop in; the ones there from the start are simply there.
 */
export const CakeShownContext = createContext<RefObject<boolean>>({ current: false })

/**
 * Drops its children onto the cake when they appear or move (`sig` changes): they fall from `height` above and
 * settle into the cream. `delay` staggers a ring of pieces so they land one after another.
 */
export function Arrival({
  sig,
  delay = 0,
  height = 0.32,
  children,
}: {
  sig: string
  delay?: number
  height?: number
  children: ReactNode
}) {
  const group = useRef<THREE.Group>(null)
  const shown = useContext(CakeShownContext)
  const still = useReducedMotionScene()
  const settler = useSettler()
  const [timeline] = useState(() => new Timeline())

  useLayoutEffect(() => {
    const g = group.current
    if (!g || !shown.current || still) return
    timeline.play(ARRIVE_MS, delay)
    // Hidden until its turn, then it falls; set before the next frame, so it never shows in place first.
    g.visible = delay <= 0
    g.position.y = height
    return settler.add(() => {
      timeline.finish()
      g.visible = true
      g.position.y = 0
    })
  }, [sig, delay, height, shown, still, settler, timeline])

  const invalidate = useThree((state) => state.invalidate)
  useFrame(() => {
    const g = group.current
    if (!g || !timeline.active) return
    // Waiting for its turn or falling: either way the next frame is needed (scenes may render on demand).
    invalidate()
    const now = performance.now()
    if (timeline.waiting(now)) return
    g.visible = true
    g.position.y = height * (1 - easeOutSoft(timeline.progress(now)))
  })

  return <group ref={group}>{children}</group>
}

/**
 * Slides its children to a new place on the cake (`x`, `z`) instead of dropping them again: candles spread round
 * the top make room when one is added, and only the new one falls.
 */
export function Glide({ x, z, children }: { x: number; z: number; children: ReactNode }) {
  const group = useRef<THREE.Group>(null)
  const at = useRef<{ x: number; z: number } | null>(null)
  const from = useRef({ x: 0, z: 0 })
  const still = useReducedMotionScene()
  const settler = useSettler()
  const [timeline] = useState(() => new Timeline())

  useLayoutEffect(() => {
    const g = group.current
    const before = at.current
    at.current = { x, z }
    if (!g || !before || still) return
    // From where it is on screen now: its old place, or partway there if it was still sliding.
    from.current = { x: before.x + g.position.x - x, z: before.z + g.position.z - z }
    g.position.set(from.current.x, 0, from.current.z)
    timeline.play(ARRIVE_MS)
    return settler.add(() => {
      timeline.finish()
      g.position.set(0, 0, 0)
    })
  }, [x, z, still, settler, timeline])

  const invalidate = useThree((state) => state.invalidate)
  useFrame(() => {
    const g = group.current
    if (!g || !timeline.active) return
    invalidate()
    const left = 1 - easeOutSoft(timeline.progress(performance.now()))
    g.position.set(from.current.x * left, 0, from.current.z * left)
  })

  return <group ref={group}>{children}</group>
}

/** What identifies a list of placements: when it changes, the pieces have moved and land again. */
export const placementSig = (list: readonly { x: number; z: number }[]) =>
  list.length ? `${list.length}:${list[0].x.toFixed(3)}:${list[0].z.toFixed(3)}` : ''
