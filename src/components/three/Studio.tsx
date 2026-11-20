'use client'

import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { Suspense } from 'react'
import { useQuality } from './motion'
import { SCENE } from './theme'

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
        intensity={1.2}
        color={SCENE.light.panelWarm}
        position={[-5, 1.5, 2]}
        rotation-y={Math.PI / 2}
        scale={[4, 3, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.1}
        color={SCENE.light.panelMint}
        position={[5, 1, -1]}
        rotation-y={-Math.PI / 2}
        scale={[3, 4, 1]}
      />
    </>
  )
}

/**
 * Morning-in-the-shop lighting for every scene: warm sunlight on the cake from the front right, a mint fill
 * from behind, a peach bounce from below, and a hemisphere that keeps shadows a soft green instead of grey.
 * Reflections come from a real café interior (Poly Haven, CC0) on the high tier, or from soft panels.
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
      <hemisphereLight args={[SCENE.light.sky, SCENE.light.ground, high ? 1.05 : 1.35]} />
      <directionalLight
        position={[3, 5.5, 4.5]}
        intensity={high ? 2.5 : 2.3}
        color={SCENE.light.key}
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
      <directionalLight position={[-4, 3, -4]} intensity={high ? 1.3 : 1.1} color={SCENE.light.fill} />
      <pointLight position={[-2.5, -0.5, 2.5]} intensity={2.2} distance={8} color={SCENE.light.bounce} />
      <Environment resolution={256} frames={1} environmentIntensity={0.85}>
        <Panels />
      </Environment>
      {high && (
        <Suspense fallback={null}>
          <Environment files={CAFE_HDRI} environmentIntensity={0.7} resolution={256}>
            <Panels />
          </Environment>
        </Suspense>
      )}
      {shadows && (
        <ContactShadows
          position={[0, floor + 0.002, 0]}
          opacity={0.35}
          scale={shadowScale}
          blur={2.4}
          far={1.6}
          resolution={512}
          color={SCENE.ink}
        />
      )}
    </>
  )
}
