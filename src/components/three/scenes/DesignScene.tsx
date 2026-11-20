'use client'

import { OrbitControls } from '@react-three/drei'
import type { EffectComposer as Composer } from 'postprocessing'
import { useMemo, useRef, type RefObject } from 'react'
import { FROSTING } from '../cake/geometry'
import { Cake } from '../cake/Cake'
import { CakeStand, STAND_HEIGHT } from '../CakeStand'
import { CanvasShell } from '../CanvasShell'
import { CaptureBridge, type Capture } from '../Capture'
import { Effects } from '../Effects'
import { FitCamera } from '../FitCamera'
import { ShadowBlob } from '../ShadowBlob'
import { Studio } from '../Studio'
import { sizeOf, type CakeConfig } from '@/lib/cake'

export default function DesignScene({
  config,
  sliced,
  captureRef,
}: {
  config: CakeConfig
  sliced: boolean
  captureRef: RefObject<Capture | null>
}) {
  const composer = useRef<Composer | null>(null)
  const tiers = sizeOf(config).tiers
  const radius = tiers[0].radius + FROSTING
  const cakeHeight = tiers.reduce((sum, tier) => sum + tier.height, 0)
  const frame = useMemo(() => {
    const top = cakeHeight + (config.message ? 0.42 : config.candles ? 0.4 : 0.22)
    const bottom = -STAND_HEIGHT
    return { radius: radius + 0.55, height: top - bottom, center: (top + bottom) / 2 + 0.05 }
  }, [radius, cakeHeight, config.message, config.candles])

  return (
    <CanvasShell
      className="h-full w-full cursor-grab active:cursor-grabbing"
      label="Your cake in 3D. Drag to look around it, scroll or pinch to zoom."
      camera={{ position: [0, 2, 7], fov: 32 }}
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
        minDistance={2.6}
        maxDistance={11}
      />
      <Studio floor={-STAND_HEIGHT} shadows={false} />
      <ShadowBlob radius={radius + 0.9} y={-STAND_HEIGHT} />
      <CakeStand radius={radius} />
      <Cake config={config} sliced={sliced} />
      <Effects ref={composer} />
      <CaptureBridge captureRef={captureRef} composerRef={composer} />
    </CanvasShell>
  )
}
