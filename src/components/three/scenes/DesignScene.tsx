'use client'

import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useMemo, type RefObject } from 'react'
import { FROSTING } from '../cake/geometry'
import { Cake } from '../cake/Cake'
import { CakeStand, STAND_HEIGHT } from '../CakeStand'
import { CanvasShell } from '../CanvasShell'
import { FitCamera } from '../FitCamera'
import { Studio } from '../Studio'
import { sizeOf, type CakeConfig } from '@/lib/cake'

export type Capture = (size: number, type?: 'image/png' | 'image/jpeg', quality?: number) => string | null

/** Gives the page a way to take a square picture of the current cake. */
function CaptureBridge({ captureRef }: { captureRef: RefObject<Capture | null> }) {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)
  useEffect(() => {
    captureRef.current = (size, type = 'image/jpeg', quality = 0.86) => {
      gl.render(scene, camera)
      const source = gl.domElement
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.fillStyle = '#fff8f0'
      ctx.fillRect(0, 0, size, size)
      const side = Math.min(source.width, source.height)
      ctx.drawImage(
        source,
        (source.width - side) / 2,
        (source.height - side) / 2,
        side,
        side,
        0,
        0,
        size,
        size,
      )
      return canvas.toDataURL(type, quality)
    }
    return () => {
      captureRef.current = null
    }
  }, [gl, scene, camera, captureRef])
  return null
}

export default function DesignScene({
  config,
  sliced,
  captureRef,
}: {
  config: CakeConfig
  sliced: boolean
  captureRef: RefObject<Capture | null>
}) {
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
      <Studio floor={-STAND_HEIGHT} shadowScale={5} />
      <CakeStand radius={radius} />
      <Cake config={config} sliced={sliced} />
      <CaptureBridge captureRef={captureRef} />
    </CanvasShell>
  )
}
