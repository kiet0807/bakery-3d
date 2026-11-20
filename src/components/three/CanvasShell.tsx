'use client'

import { PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree, type CanvasProps } from '@react-three/fiber'
import {
  Component,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from 'react'
import * as THREE from 'three'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { CakeFallback } from '../CakeFallback'
import { ScenePoster } from '../ScenePoster'
import {
  PerformanceHoldContext,
  QualityContext,
  ReducedMotionContext,
  type PerformanceHold,
  type Quality,
} from './motion'
import { SettleContext, createSettler } from './tween'

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

/** How the live canvas comes in over the poster, and a held picture gives way to it: a soft decelerating fade. */
const FADE = 'opacity 420ms cubic-bezier(0.16, 1, 0.3, 1)'

/** Copies what the canvas shows into a plain 2D canvas, drawn again and copied in the same task. */
type Snapshot = () => HTMLCanvasElement | null

/**
 * Inside the canvas: reports once a few frames have been drawn (the scene is really there, shaders compiled),
 * and lends the shell a way to take a picture of the scene before the canvas is rebuilt.
 */
function CanvasReady({
  onDrawn,
  snapshotRef,
}: {
  onDrawn: () => void
  snapshotRef: RefObject<Snapshot | null>
}) {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)
  const frames = useRef(0)
  useFrame(() => {
    frames.current += 1
    if (frames.current === 3) onDrawn()
  })
  useEffect(() => {
    snapshotRef.current = () => {
      try {
        gl.render(scene, camera)
        const source = gl.domElement
        const copy = document.createElement('canvas')
        copy.width = source.width
        copy.height = source.height
        copy.style.cssText = 'display:block;width:100%;height:100%'
        copy.getContext('2d')?.drawImage(source, 0, 0)
        return copy
      } catch {
        return null
      }
    }
    return () => {
      snapshotRef.current = null
    }
  }, [gl, scene, camera, snapshotRef])
  return null
}

/** The picture of the old canvas, shown over the new one while it gets ready; fades as the new one comes in. */
function HeldPicture({
  picture,
  fading,
  onGone,
}: {
  picture: HTMLCanvasElement
  fading: boolean
  onGone: () => void
}) {
  const holder = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const element = holder.current
    if (!element) return
    element.replaceChildren(picture)
  }, [picture])
  return (
    <div
      ref={holder}
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ opacity: fading ? 0 : 1, transition: FADE }}
      onTransitionEnd={onGone}
    />
  )
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
  /**
   * Words for the loading poster shown until the scene has drawn (the same as the page's own loading poster, so
   * the hand-over is seamless). Without it the canvas simply fades in.
   */
  poster?: string
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
  poster,
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
  const [settler] = useState(createSettler)
  // The live canvas fades in once it has drawn; until then the poster (first load) or a picture of the old
  // canvas (a rebuild for another quality tier) stays in its place, so nothing ever flashes empty.
  const [drawn, setDrawn] = useState(false)
  const [posterGone, setPosterGone] = useState(false)
  const [held, setHeld] = useState<HTMLCanvasElement | null>(null)
  const snapshot = useRef<Snapshot | null>(null)
  const downgrade = () => {
    if (holds.current) return
    setHeld(snapshot.current?.() ?? null)
    setDrawn(false)
    setDowngraded(true)
  }
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
    // Without WebGL the 2D drawing's own sentence is read out, not a description of a scene that is not there.
    <div
      ref={wrapper}
      className={`relative ${className ?? ''}`}
      role={webgl === false ? undefined : 'img'}
      aria-label={webgl === false ? undefined : label}
    >
      {webgl === false && fallback}
      {webgl && poster && !posterGone && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ opacity: drawn ? 0 : 1, transition: FADE }}
          onTransitionEnd={() => setPosterGone(true)}
        >
          <ScenePoster label={poster} />
        </div>
      )}
      {webgl && (
        <SceneBoundary fallback={fallback} onError={onFallback}>
          <ReducedMotionContext.Provider value={reduced}>
            <QualityContext.Provider value={quality}>
              <Canvas
                key={quality}
                // Under a held picture the new canvas comes in at once and the picture fades off it, so the two never
                // thin out together and let the page show through.
                style={{ opacity: drawn ? 1 : 0, transition: reduced || held ? undefined : FADE }}
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
                    if (quality === 'high') downgrade()
                  }}
                  flipflops={3}
                  onFallback={() => {
                    if (quality === 'high') downgrade()
                  }}
                />
                <SettleContext.Provider value={settler}>
                  <PerformanceHoldContext.Provider value={performanceHold}>
                    {children}
                  </PerformanceHoldContext.Provider>
                </SettleContext.Provider>
                <CanvasReady onDrawn={() => setDrawn(true)} snapshotRef={snapshot} />
              </Canvas>
            </QualityContext.Provider>
          </ReducedMotionContext.Provider>
        </SceneBoundary>
      )}
      {held && <HeldPicture picture={held} fading={drawn} onGone={() => setHeld(null)} />}
    </div>
  )
}
