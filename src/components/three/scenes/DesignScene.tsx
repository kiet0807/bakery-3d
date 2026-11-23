'use client'

import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import type { EffectComposer as Composer } from 'postprocessing'
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { FROSTING } from '../cake/geometry'
import { Cake } from '../cake/Cake'
import { headroom } from '../cake/layout'
import { CakeStand, STAND_HEIGHT } from '../CakeStand'
import { CanvasShell } from '../CanvasShell'
import { CaptureBridge, type Capture } from '../Capture'
import { Effects } from '../Effects'
import { FitCamera } from '../FitCamera'
import { ShadowBlob } from '../ShadowBlob'
import { IdlePace } from '../IdlePace'
import { useReducedMotionScene } from '../motion'
import { Studio } from '../Studio'
import { useSettler } from '../tween'
import { useDict } from '@/i18n/LangProvider'
import { sizeOf, type CakeConfig } from '@/lib/cake'
import { usePalette } from '@/lib/usePalette'

/**
 * The path tracer (about 66 KB gzipped) loads only when someone asks for a studio photo. Phones never offer it, so
 * they never download it.
 */
const PhotoMode = lazy(() => import('../PhotoMode').then((module) => ({ default: module.PhotoMode })))

/** The OrbitControls events this needs. */
interface OrbitEvents {
  addEventListener: (type: 'change' | 'end', listener: () => void) => void
  removeEventListener: (type: 'change' | 'end', listener: () => void) => void
}

/** The orbit's damping: each frame the camera keeps this share of the speed it had. */
const ORBIT_DAMPING = 0.08
/**
 * Frames drawn after the last orbit or zoom step (see OrbitTail). Damping is per frame, not per second: after 90
 * frames 0.92^90, about 0.05 %, of the leftover glide remains.
 */
const ORBIT_TAIL_FRAMES = 90

/**
 * OrbitControls asks for a frame only while a step moves the camera by more than its tiny threshold, so on demand
 * the damped glide after a drag stops with a few pixels still to go, which would then creep in during the next
 * change. Frames keep coming for a moment after the last step, until what is left is far below a pixel.
 */
function OrbitTail() {
  const controls = useThree((state) => state.controls) as unknown as OrbitEvents | null
  const invalidate = useThree((state) => state.invalidate)
  const left = useRef(0)
  useEffect(() => {
    if (!controls) return
    const extend = () => {
      left.current = ORBIT_TAIL_FRAMES
      invalidate()
    }
    controls.addEventListener('change', extend)
    controls.addEventListener('end', extend)
    return () => {
      controls.removeEventListener('change', extend)
      controls.removeEventListener('end', extend)
    }
  }, [controls, invalidate])
  useFrame(() => {
    if (left.current <= 0) return
    left.current -= 1
    invalidate()
  })
  return null
}

/** The OrbitControls calls FaceTheSlice makes. */
interface OrbitTurn {
  enableDamping: boolean
  getAzimuthalAngle: () => number
  setAzimuthalAngle: (angle: number) => void
  addEventListener: (type: 'start', listener: () => void) => void
  removeEventListener: (type: 'start', listener: () => void) => void
}

/** How long a picture taken right after the cut still lands the camera at the front, in milliseconds. */
const FACE_SLICE_MS = 1500

/**
 * The slice comes out at the front (+Z). Someone who turned the cake round before cutting it saw it come out at
 * the back, so on the cut the camera turns back to the front: with the orbit's own damped glide, or at once with
 * reduced motion. A picture taken meanwhile is taken from the front; dragging the cake hands the camera back.
 */
function FaceTheSlice({ sliced }: { sliced: boolean }) {
  const get = useThree((state) => state.get)
  const still = useReducedMotionScene()
  const settler = useSettler()
  const was = useRef(sliced)
  useEffect(() => {
    const cut = sliced && !was.current
    was.current = sliced
    // Read when the cake is cut: the orbit is the scene's default controls by then.
    const controls = get().controls as unknown as OrbitTurn | null
    if (!cut || !controls || Math.abs(controls.getAzimuthalAngle()) < Math.PI / 4) return
    const land = () => {
      controls.enableDamping = false
      controls.setAzimuthalAngle(0)
      controls.enableDamping = true
    }
    if (still) return land()
    controls.setAzimuthalAngle(0)
    const unsettle = settler.add(land)
    const stop = () => {
      unsettle()
      controls.removeEventListener('start', stop)
    }
    controls.addEventListener('start', stop)
    const timer = window.setTimeout(stop, FACE_SLICE_MS)
    return () => {
      window.clearTimeout(timer)
      stop()
    }
  }, [sliced, get, still, settler])
  return null
}

/**
 * The scene renders on demand, so anything that changes the picture must ask for a frame. Tweens, the camera
 * glide and orbiting do that themselves; this covers the rest in one place: a design change that only rewrites
 * buffers (topping positions, the plaque's words) and a palette change (lights, environment panels, AO colour).
 */
function RedrawOnChange({ config, sliced }: { config: CakeConfig; sliced: boolean }) {
  const invalidate = useThree((state) => state.invalidate)
  const palette = usePalette()
  useEffect(() => invalidate(), [invalidate, config, sliced, palette])
  return null
}

export default function DesignScene({
  config,
  sliced,
  captureRef,
  photo = false,
  onPhotoProgress = () => {},
  onPhotoError = () => {},
  onFallback,
  onReady,
}: {
  config: CakeConfig
  sliced: boolean
  captureRef: RefObject<Capture | null>
  /** Path-traced photo mode: the camera is held still while the picture develops. */
  photo?: boolean
  onPhotoProgress?: (progress: number) => void
  onPhotoError?: (error: unknown) => void
  /** The 2D drawing is shown instead (no WebGL, or the scene crashed): there is nothing to photograph. */
  onFallback?: () => void
  /** The live scene has drawn (the hint that the cake turns waits for it). */
  onReady?: () => void
}) {
  const { scenes, design } = useDict()
  const composer = useRef<Composer | null>(null)
  const draw = useRef<(() => void) | null>(null)
  const tiers = sizeOf(config).tiers
  const radius = tiers[0].radius + FROSTING
  const cakeHeight = tiers.reduce((sum, tier) => sum + tier.height, 0)
  const frame = useMemo(() => {
    const top = cakeHeight + headroom(config)
    const bottom = -STAND_HEIGHT
    return { radius: radius + 0.55, height: top - bottom, center: (top + bottom) / 2 + 0.05 }
  }, [radius, cakeHeight, config])
  // The orbit's first target only: after that FitCamera moves it, gliding with the camera when the cake changes.
  const [target] = useState<[number, number, number]>(() => [0, frame.center, 0])
  // Still, the scene draws only when something changes (it used to draw 60 times a second, cake standing still).
  // The studio photo develops frame by frame; lit candles flicker at the idle pace.
  const mode = photo ? 'always' : 'demand'

  return (
    <CanvasShell
      className="h-full w-full cursor-grab active:cursor-grabbing"
      label={scenes.design}
      poster={design.loading}
      camera={{ position: [0, 2, 7], fov: 32 }}
      onFallback={onFallback}
      onReady={onReady}
      mode={mode}
    >
      <RedrawOnChange config={config} sliced={sliced} />
      <OrbitTail />
      <FaceTheSlice sliced={sliced} />
      {config.candles > 0 && <IdlePace />}
      <FitCamera
        radius={frame.radius}
        height={frame.height}
        center={[0, frame.center, 0]}
        elevation={18}
        margin={1.05}
        glide
      />
      <OrbitControls
        makeDefault
        target={target}
        enablePan={false}
        enableDamping
        dampingFactor={ORBIT_DAMPING}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 2 - 0.08}
        // Small cakes (a 10 cm bento) may come closer than big ones.
        minDistance={Math.min(2.6, frame.radius * 2.2)}
        maxDistance={11}
        enabled={!photo}
      />
      <Studio />
      <ShadowBlob radius={radius + 0.9} y={-STAND_HEIGHT} />
      <CakeStand radius={radius} />
      <Cake config={config} sliced={sliced} />
      {photo ? (
        <Suspense fallback={null}>
          <PhotoMode
            floorY={-STAND_HEIGHT}
            drawRef={draw}
            onProgress={onPhotoProgress}
            onError={onPhotoError}
          />
        </Suspense>
      ) : (
        <Effects ref={composer} />
      )}
      <CaptureBridge captureRef={captureRef} composerRef={composer} drawRef={draw} />
    </CanvasShell>
  )
}
