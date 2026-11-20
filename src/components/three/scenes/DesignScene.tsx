'use client'

import { OrbitControls } from '@react-three/drei'
import type { EffectComposer as Composer } from 'postprocessing'
import { lazy, Suspense, useMemo, useRef, type RefObject } from 'react'
import { FROSTING } from '../cake/geometry'
import { Cake } from '../cake/Cake'
import { headroom } from '../cake/layout'
import { CakeStand, STAND_HEIGHT } from '../CakeStand'
import { CanvasShell } from '../CanvasShell'
import { CaptureBridge, type Capture } from '../Capture'
import { Effects } from '../Effects'
import { FitCamera } from '../FitCamera'
import { ShadowBlob } from '../ShadowBlob'
import { Studio } from '../Studio'
import { useDict } from '@/i18n/LangProvider'
import { sizeOf, type CakeConfig } from '@/lib/cake'

/**
 * The path tracer (about 66 KB gzipped) loads only when someone asks for a studio photo. Phones never offer it, so
 * they never download it.
 */
const PhotoMode = lazy(() => import('../PhotoMode').then((module) => ({ default: module.PhotoMode })))

export default function DesignScene({
  config,
  sliced,
  captureRef,
  photo = false,
  onPhotoProgress = () => {},
  onPhotoError = () => {},
  onFallback,
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
}) {
  const { scenes } = useDict()
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

  return (
    <CanvasShell
      className="h-full w-full cursor-grab active:cursor-grabbing"
      label={scenes.design}
      camera={{ position: [0, 2, 7], fov: 32 }}
      onFallback={onFallback}
    >
      <FitCamera
        radius={frame.radius}
        height={frame.height}
        center={[0, frame.center, 0]}
        elevation={18}
        margin={1.05}
      />
      <OrbitControls
        makeDefault
        target={[0, frame.center, 0]}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 2 - 0.08}
        // Small cakes (a 10 cm bento) may come closer than big ones.
        minDistance={Math.min(2.6, frame.radius * 2.2)}
        maxDistance={11}
        enabled={!photo}
      />
      <Studio floor={-STAND_HEIGHT} shadows={false} />
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
