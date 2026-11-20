'use client'

import { useFrame } from '@react-three/fiber'
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

  useFrame(() => {
    const g = group.current
    if (!g || !timeline.active) return
    const now = performance.now()
    if (timeline.waiting(now)) return
    g.visible = true
    g.position.y = height * (1 - easeOutSoft(timeline.progress(now)))
  })

  return <group ref={group}>{children}</group>
}

/** What identifies a list of placements: when it changes, the pieces have moved and land again. */
export const placementSig = (list: readonly { x: number; z: number }[]) =>
  list.length ? `${list.length}:${list[0].x.toFixed(3)}:${list[0].z.toFixed(3)}` : ''
