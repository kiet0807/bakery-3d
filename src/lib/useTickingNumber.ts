'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * A number that runs to its new value instead of jumping (a price after a choice): 380 ms, fast then settling,
 * in steps of `step` (1.000đ, so no odd amounts flash by). A new value mid-run starts from where the count is.
 * It jumps when the visitor asked for less motion, and in the first half second after mounting: a page that fills
 * itself in from a link or the saved cart should not count up on arrival.
 */
export function useTickingNumber(value: number, { duration = 380, step = 1000 } = {}) {
  const [shown, setShown] = useState(value)
  const current = useRef(value)
  const born = useRef<number | null>(null)
  useEffect(() => {
    born.current ??= performance.now()
    const from = current.current
    if (from === value) return
    const instant =
      performance.now() - born.current < 500 || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = instant ? 1 : Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 4)
      const next = t >= 1 ? value : Math.round((from + (value - from) * eased) / step) * step
      current.current = next
      setShown(next)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration, step])
  return shown
}
