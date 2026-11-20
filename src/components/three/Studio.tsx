'use client'

import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { Suspense } from 'react'
import { useQuality } from './motion'

/** "Comfy Café" by Sergej Majboroda, Poly Haven (CC0): the light of every high-tier scene and of photos. */
export const CAFE_HDRI = '/hdri/comfy_cafe_1k.hdr'

/** Soft panels around the cake: shaped highlights on glaze and porcelain. Rendered once, no download. */
function Panels() {
  return (
    <>
      <Lightformer
        form="rect"
        intensity={1.6}
        position={[0, 5, 1]}
        rotation-x={Math.PI / 2}
        scale={[8, 4, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.1}
        color="#ffe2c6"
        position={[-5, 1.5, 2]}
        rotation-y={Math.PI / 2}
        scale={[4, 3, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.2}
        color="#a9b8ff"
        position={[5, 1, -1]}
        rotation-y={-Math.PI / 2}
        scale={[3, 4, 1]}
      />
    </>
  )
}

/**
 * Night-bakery lighting for every scene: a warm key light on the cake (it is the only warm thing on screen),
 * a cool moonlit rim from behind, and reflections from a real café interior (Poly Haven, CC0) on the high
 * tier, or from soft panels on the low tier.
 */
export function Studio({
  floor,
  shadowScale = 7,
  shadows = true,
}: {
  floor: number
  shadowScale?: number
  shadows?: boolean
}) {
  const quality = useQuality()
  const high = quality === 'high'
  return (
    <>
      <hemisphereLight args={['#7d92f0', '#2a1b16', high ? 0.5 : 0.75]} />
      <directionalLight
        position={[3, 5.5, 4.5]}
        intensity={high ? 2.6 : 2.2}
        color="#ffe6cc"
        castShadow={high}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-near={1}
        shadow-camera-far={16}
      />
      <directionalLight position={[-4, 3, -4]} intensity={high ? 2.2 : 1.6} color="#8ea2ff" />
      <pointLight position={[-2.5, -0.5, 2.5]} intensity={3} distance={8} color="#ff9fb4" />
      <Environment resolution={256} frames={1} environmentIntensity={0.7}>
        <Panels />
      </Environment>
      {high && (
        <Suspense fallback={null}>
          <Environment files={CAFE_HDRI} environmentIntensity={0.6} resolution={256}>
            <Panels />
          </Environment>
        </Suspense>
      )}
      {shadows && (
        <ContactShadows
          position={[0, floor + 0.002, 0]}
          opacity={0.6}
          scale={shadowScale}
          blur={2.4}
          far={1.6}
          resolution={512}
          color="#000814"
        />
      )}
    </>
  )
}
