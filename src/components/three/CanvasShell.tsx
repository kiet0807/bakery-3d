'use client'

import { PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree, type CanvasProps } from '@react-three/fiber'
import {
  Component,
  createContext,
  useContext,
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
import { usePalette } from '@/lib/usePalette'
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
import { prefetchScenes } from './sceneCode'
import { SettleContext, createSettler, useSettler } from './tween'

let webglSupport: boolean | null = null

/** Checked once per page; the answer cannot change while the page is open. */
function supportsWebGL(): boolean {
  if (webglSupport !== null) return webglSupport
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    webglSupport = Boolean(context)
    // Given back at once: browsers keep a small number of contexts alive, and the oldest one dies first.
    context?.getExtension('WEBGL_lose_context')?.loseContext()
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

/**
 * How long a scene that renders on demand keeps drawing every frame after it first appears: the frame-rate
 * monitor needs 10 windows of 250 ms for a verdict, plus some slack.
 */
const WARM_UP_MS = 3000

/** How the live canvas comes in over the poster, and a held picture gives way to it: a soft decelerating fade. */
const FADE = 'opacity 420ms cubic-bezier(0.16, 1, 0.3, 1)'

/** Copies what the canvas shows into a plain 2D canvas, drawn again and copied in the same task. */
type Snapshot = () => HTMLCanvasElement | null

/** Lets a scene that is still putting itself together keep its poster up (see `useHoldPoster`). */
interface Building {
  hold: () => () => void
}
const BuildingContext = createContext<Building | null>(null)

/**
 * For a scene that builds itself over several frames instead of in one long one (the vitrine puts one cake a frame
 * on its table): while `building` is true the poster stays up and the canvas hidden, so nothing comes in half made.
 */
export function useHoldPoster(building: boolean) {
  const context = useContext(BuildingContext)
  useLayoutEffect(() => (building ? context?.hold() : undefined), [building, context])
}

/**
 * Inside the canvas: reports once a few frames have been drawn (the scene is really there, shaders compiled),
 * and lends the shell a way to take a picture of the scene before the canvas is rebuilt.
 */
function CanvasReady({
  onDrawn,
  snapshotRef,
  buildingRef,
}: {
  onDrawn: () => void
  snapshotRef: RefObject<Snapshot | null>
  /** How many parts of the scene are still building themselves: the frames are counted once they are done. */
  buildingRef: RefObject<number>
}) {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)
  const invalidate = useThree((state) => state.invalidate)
  const frames = useRef(0)
  useFrame(() => {
    if (buildingRef.current > 0 && frames.current < 3) {
      frames.current = 0
      invalidate()
      return
    }
    frames.current += 1
    if (frames.current === 3) onDrawn()
    // Asks for the frames it counts, so a scene rendering on demand cannot leave its poster up.
    else if (frames.current < 3) invalidate()
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

/**
 * For scenes that render on demand: draws again whenever the canvas itself changes underneath the scene. A new
 * size or pixel ratio clears the drawing buffer, and coming back on screen (the loop was "never") or switching
 * loop modes may follow changes made meanwhile (a palette switched while scrolled away); a palette switched in view
 * recolours lights and materials. Tweens started from React effects get their first frame through the settler
 * (`connect`), wired up here too.
 */
function KeepFresh() {
  const invalidate = useThree((state) => state.invalidate)
  const frameloop = useThree((state) => state.frameloop)
  const size = useThree((state) => state.size)
  const dpr = useThree((state) => state.viewport.dpr)
  const settler = useSettler()
  useLayoutEffect(() => settler.connect(invalidate), [settler, invalidate])
  const palette = usePalette()
  useEffect(() => invalidate(), [invalidate, frameloop, size, dpr, palette])
  return null
}

/** How long a lost GPU context gets to come back before the 2D drawing takes over. */
const CONTEXT_GRACE_MS = 3000

/**
 * The GPU can take the context away (a driver reset, a phone short of memory). three.js redraws everything if the
 * browser gives it back; if it does not, the page would keep an empty stage, so the 2D drawing takes its place.
 * Lives inside the canvas: unmounting it loses the context on purpose, and by then this no longer listens.
 */
function ContextGuard({ onGone }: { onGone: () => void }) {
  const gl = useThree((state) => state.gl)
  const invalidate = useThree((state) => state.invalidate)
  const gone = useRef(onGone)
  useEffect(() => {
    gone.current = onGone
  })
  useEffect(() => {
    const canvas = gl.domElement
    let timer = 0
    const onLost = () => {
      timer = window.setTimeout(() => gone.current(), CONTEXT_GRACE_MS)
    }
    const onRestored = () => {
      window.clearTimeout(timer)
      invalidate()
    }
    canvas.addEventListener('webglcontextlost', onLost)
    canvas.addEventListener('webglcontextrestored', onRestored)
    return () => {
      window.clearTimeout(timer)
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
    }
  }, [gl, invalidate])
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
  /**
   * "demand" renders only when something changes; "always" for scenes with idle animation. It may change while
   * the scene is open (the design scene goes to "always" while candles burn): the canvas is not rebuilt.
   */
  mode?: 'always' | 'demand'
  onCreated?: CanvasProps['onCreated']
  /** Called when the 2D drawing is shown instead: no WebGL, or the scene crashed. */
  onFallback?: () => void
  /** Called when the live scene has drawn and is coming in (again after a rebuild for another tier). */
  onReady?: () => void
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
  onReady,
  lowDpr = 1.25,
  poster,
}: CanvasShellProps) {
  const wrapper = useRef<HTMLDivElement>(null)
  // Device facts are read after hydration (the server renders no canvas at all).
  const supported = useSyncExternalStore<boolean | null>(noSubscription, supportsWebGL, () => null)
  const [lost, setLost] = useState(false)
  const webgl = lost ? false : supported
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
  // A scene that renders on demand still starts on "always", for WARM_UP_MS after it has drawn: long enough for
  // the frame-rate monitor to give its verdict on this device (see `measured` below).
  const [warmedUp, setWarmedUp] = useState(false)
  const downgrade = () => {
    if (holds.current) return
    setHeld(snapshot.current?.() ?? null)
    setDrawn(false)
    // The rebuilt canvas measures again from the start.
    setWarmedUp(false)
    setDowngraded(true)
  }
  useEffect(() => {
    if (mode !== 'demand' || !drawn || warmedUp) return
    const timer = window.setTimeout(() => setWarmedUp(true), WARM_UP_MS)
    return () => window.clearTimeout(timer)
  }, [mode, drawn, warmedUp])
  const loop = mode === 'demand' && warmedUp ? 'demand' : 'always'
  /**
   * drei's PerformanceMonitor turns the frames it sees into a frame rate, 250 ms at a time. On demand a still
   * scene draws a frame now and then, which reads as a few frames per second: it would "decline" and drop a fast
   * machine to the light tier. So it only watches while frames come back to back (the "always" loop: the warm-up,
   * lit candles, the studio photo), and is unmounted otherwise. Remounted, it starts a fresh measurement.
   */
  const measured = loop === 'always'
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
  const building = useRef(0)
  const buildingHold = useMemo<Building>(
    () => ({
      hold: () => {
        building.current += 1
        let released = false
        return () => {
          if (released) return
          released = true
          building.current -= 1
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

  useEffect(() => {
    if (!drawn) return
    onReady?.()
    // This device draws 3D: the other scenes load in quiet moments, ready before the visitor opens them.
    prefetchScenes()
  }, [drawn, onReady])

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
                frameloop={inView ? loop : 'never'}
                gl={{ antialias: !high, alpha: true, powerPreference: 'high-performance' }}
                onCreated={(state) => {
                  // Neutral tone mapping keeps pastel frosting true on a light page; the high tier's effect chain
                  // applies the same curve itself.
                  state.gl.toneMapping = THREE.NeutralToneMapping
                  onCreated?.(state)
                }}
                aria-hidden
              >
                {measured && (
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
                )}
                <SettleContext.Provider value={settler}>
                  <KeepFresh />
                  <ContextGuard onGone={() => setLost(true)} />
                  <PerformanceHoldContext.Provider value={performanceHold}>
                    <BuildingContext.Provider value={buildingHold}>{children}</BuildingContext.Provider>
                  </PerformanceHoldContext.Provider>
                </SettleContext.Provider>
                <CanvasReady onDrawn={() => setDrawn(true)} snapshotRef={snapshot} buildingRef={building} />
              </Canvas>
            </QualityContext.Provider>
          </ReducedMotionContext.Provider>
        </SceneBoundary>
      )}
      {held && <HeldPicture picture={held} fading={drawn} onGone={() => setHeld(null)} />}
    </div>
  )
}
