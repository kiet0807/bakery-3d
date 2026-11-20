'use client'

import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { useEffect } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { setSmoothScroll } from '@/lib/smoothScroll'

/**
 * Smooth wheel scrolling on every page (Lenis, the feel the home story was tuned with: lerp 0.085). Touch keeps the
 * phone's own scrolling. Off when the visitor asked for less motion.
 * - `autoToggle`: Lenis pauses by itself while the page is locked with `overflow: hidden` (the welcome screen).
 * - `stopInertiaOnNavigate`: a click on a link to another page stops the glide, so it cannot fight the router's
 *   jump to the top of the new page.
 * - The 3D stage on /design is marked `data-lenis-prevent`: the wheel zooms the cake there, not the page.
 */
export function SmoothScroll() {
  const reduced = useReducedMotion()

  useEffect(() => {
    // The hook says "no" on the first pass after hydration; ask the system directly so Lenis never starts for
    // someone who turned motion down.
    if (reduced || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.085,
      smoothWheel: true,
      autoToggle: true,
      stopInertiaOnNavigate: true,
    })
    setSmoothScroll(lenis)
    return () => {
      setSmoothScroll(null)
      lenis.destroy()
    }
  }, [reduced])

  return null
}
