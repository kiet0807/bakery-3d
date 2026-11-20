'use client'

import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useQuality } from './motion'

/**
 * The photographic finish: ambient occlusion so toppings sit in the cream instead of floating on it, a
 * gentle bloom on candle flames, a light vignette, and filmic tone mapping. Skipped on the "low" tier, where
 * the renderer's own tone mapping gives the same colours.
 */
export function Effects({ ao = 1 }: { ao?: number }) {
  const quality = useQuality()
  if (quality !== 'high') return null
  return (
    <EffectComposer multisampling={4}>
      <N8AO
        aoRadius={0.32}
        distanceFalloff={0.55}
        intensity={2.4 * ao}
        quality="medium"
        color="#2a1a2a"
        halfRes={false}
      />
      <Bloom luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.85} mipmapBlur />
      <Vignette offset={0.32} darkness={0.28} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
