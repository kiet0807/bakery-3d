'use client'

import { PerformanceMonitor } from '@react-three/drei'
import { Canvas, type CanvasProps } from '@react-three/fiber'
import { Component, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import * as THREE from 'three'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { CakeFallback } from '../CakeFallback'
import {
  PerformanceHoldContext,
  QualityContext,
  ReducedMotionContext,
  type PerformanceHold,
  type Quality,
} from './motion'

let webglSupport: boolean | null = null

/** Checked once per page; the answer cannot change while the page is open. */
function supportsWebGL(): boolean {
  if (webglSupport !== null) return webglSupport
  try {
    const canvas = document.createElement('canvas')
    webglSupport = Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    webglSupport = false
  }
  return webglSupport
}

const noSubscription = () => () => {}

/** Phones and machines with few cores start on the light tier; the frame rate can still move them down. */
function startingQuality(): Quality {
  if (typeof window === 'undefined') return 'high'
  const small = window.matchMedia('(max-width: 767px)').matches
  const cores = navigator.hardwareConcurrency ?? 8
  return small || cores <= 4 ? 'low' : 'high'
}

class SceneBoundary extends Component<
  { fallback: ReactNode; children: ReactNode; onError?: () => void },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.warn('3D scene failed, showing the 2D version instead.', error)
    this.props.onError?.()
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export interface CanvasShellProps {
  children: ReactNode
  /** What the scene shows, for screen readers. */
  label: string
  camera?: CanvasProps['camera']
  className?: string
  /** "demand" renders only when something changes; "always" for scenes with idle animation. */
  mode?: 'always' | 'demand'
  onCreated?: CanvasProps['onCreated']
  /** Called when the 2D drawing is shown instead: no WebGL, or the scene crashed. */
  onFallback?: () => void
  /** Pixel ratio on the light tier. Scenes with many objects (the vitrine) can go lower. */
  lowDpr?: number
}

/**
 * Every 3D scene goes through here: WebGL check with a 2D fallback, rendering paused while the canvas is
 * off screen, a quality tier that follows the measured frame rate, and the reduced-motion preference.
 */
export function CanvasShell({
  children,
  label,
  camera,
  className,
  mode = 'always',
  onCreated,
  onFallback,
  lowDpr = 1.25,
}: CanvasShellProps) {
  const wrapper = useRef<HTMLDivElement>(null)
  // Device facts are read after hydration (the server renders no canvas at all).
  const webgl = useSyncExternalStore<boolean | null>(noSubscription, supportsWebGL, () => null)
  const deviceQuality = useSyncExternalStore<Quality>(noSubscription, startingQuality, () => 'high')
  const [downgraded, setDowngraded] = useState(false)
  const quality: Quality = downgraded ? 'low' : deviceQuality
  const [inView, setInView] = useState(true)
  const [dpr, setDpr] = useState(1.5)
  const reduced = useReducedMotion()
  // While something holds the tier (photo mode), frame-rate changes are ignored.
  const holds = useRef(0)
  const performanceHold = useMemo<PerformanceHold>(
    () => ({
      hold: () => {
        holds.current += 1
        let released = false
        return () => {
          if (released) return
          released = true
          // Give the frame rate a moment to recover before the monitor counts again.
          window.setTimeout(() => (holds.current -= 1), 2500)
        }
      },
    }),
    [],
  )

  useEffect(() => {
    const element = wrapper.current
    if (!element || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '160px',
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Pages that wait for the scene (the home page's welcome screen) must not wait for one that never comes.
  useEffect(() => {
    if (webgl === false) onFallback?.()
  }, [webgl, onFallback])

  const fallback = <CakeFallback />
  const maxDpr = typeof window === 'undefined' ? 2 : Math.min(2, window.devicePixelRatio || 1)
  const high = quality === 'high'

  return (
    <div ref={wrapper} className={className} role="img" aria-label={label}>
      {webgl === false && fallback}
      {webgl && (
        <SceneBoundary fallback={fallback} onError={onFallback}>
          <ReducedMotionContext.Provider value={reduced}>
            <QualityContext.Provider value={quality}>
              <Canvas
                key={quality}
                dpr={Math.min(high ? dpr : lowDpr, maxDpr)}
                shadows={high ? 'percentage' : false}
                camera={camera}
                frameloop={inView ? mode : 'never'}
                gl={{ antialias: !high, alpha: true, powerPreference: 'high-performance' }}
                onCreated={(state) => {
                  // Neutral tone mapping keeps pastel frosting true on a light page; the high tier's effect chain
                  // applies the same curve itself.
                  state.gl.toneMapping = THREE.NeutralToneMapping
                  onCreated?.(state)
                }}
                aria-hidden
              >
                <PerformanceMonitor
                  onIncline={() => {
                    if (!holds.current) setDpr(2)
                  }}
                  onDecline={() => {
                    if (holds.current) return
                    setDpr(1)
                    setDowngraded(true)
                  }}
                  flipflops={3}
                  onFallback={() => {
                    if (!holds.current) setDowngraded(true)
                  }}
                />
                <PerformanceHoldContext.Provider value={performanceHold}>
                  {children}
                </PerformanceHoldContext.Provider>
              </Canvas>
            </QualityContext.Provider>
          </ReducedMotionContext.Provider>
        </SceneBoundary>
      )}
    </div>
  )
}
