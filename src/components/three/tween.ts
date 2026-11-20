'use client'

import { createContext, useContext } from 'react'
import * as THREE from 'three'

/**
 * Small, time-based animation pieces for the 3D scenes. Every change a visitor makes to a cake (a colour, a size,
 * a topping) eases into place instead of jumping, and every tween can be finished at once: a saved picture or the
 * studio photo must show the cake as it will be, not halfway there.
 */

/** Decelerates to a stop: confident arrivals (colours, the camera). */
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * Decelerates and settles with a hint of give (about 3 % past the mark, then back), like a piece landing in soft
 * cream. Used for things that move in space: the cake changing size, toppings dropping on.
 */
export const easeOutSoft = (t: number) => {
  const s = 0.9
  const u = t - 1
  return 1 + (s + 1) * u * u * u + s * u * u
}

/** Durations, in milliseconds. A colour is quick; a change of shape takes a little longer to read. */
export const COLOUR_MS = 420
export const RESHAPE_MS = 560
export const ARRIVE_MS = 480

/** Progress from 0 to 1 over a fixed time, read each frame. Not a React state: it lives in a ref. */
export class Timeline {
  private start = 0
  private length = 1
  active = false

  play(ms: number, delay = 0) {
    this.start = performance.now() + delay
    this.length = ms
    this.active = true
  }

  finish() {
    this.active = false
  }

  /** Still waiting for its delay to pass. */
  waiting(now = performance.now()) {
    return this.active && now < this.start
  }

  /** 0 to 1; 1 once it has arrived (and then it stops being active). */
  progress(now = performance.now()) {
    if (!this.active) return 1
    const t = (now - this.start) / this.length
    if (t >= 1) {
      this.active = false
      return 1
    }
    return Math.max(0, t)
  }
}

/** Eases a colour (a material's own `color`) to a new value; `step()` each frame, `finish()` to jump there. */
export class ColourTween {
  private readonly from = new THREE.Color()
  private readonly to = new THREE.Color()
  private readonly timeline = new Timeline()

  constructor(readonly colour: THREE.Color) {}

  get active() {
    return this.timeline.active
  }

  set(value: THREE.ColorRepresentation, instant: boolean) {
    this.to.set(value)
    if (instant) {
      this.finish()
      return
    }
    this.from.copy(this.colour)
    this.timeline.play(COLOUR_MS)
  }

  step(now = performance.now()) {
    if (!this.timeline.active) return
    this.colour.copy(this.from).lerp(this.to, easeOutCubic(this.timeline.progress(now)))
  }

  finish() {
    this.timeline.finish()
    this.colour.copy(this.to)
  }
}

/**
 * The tweens running in one canvas. Each registers how to jump to its end; `finishAll()` does that for every
 * one, so the very next render shows the settled scene (pictures, the path-traced photo).
 */
export interface Settler {
  add: (finish: () => void) => () => void
  finishAll: () => void
}

export function createSettler(): Settler {
  const running = new Set<() => void>()
  return {
    add: (finish) => {
      running.add(finish)
      return () => void running.delete(finish)
    },
    finishAll: () => {
      for (const finish of [...running]) finish()
      running.clear()
    },
  }
}

export const SettleContext = createContext<Settler>(createSettler())

export const useSettler = () => useContext(SettleContext)
