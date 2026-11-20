'use client'

import { Bloom, EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode, type EffectComposer as Composer } from 'postprocessing'
import type { Ref } from 'react'
import { useQuality } from './motion'
import { SCENE } from './theme'

/**
 * The photographic finish: warm ambient occlusion so toppings sit in the cream instead of floating on it, a
 * small bloom kept for candle flames only, and neutral tone mapping, which keeps pastel frosting the colour
 * the customer picked (filmic curves grey it out on a light page). No vignette: on a bright, transparent canvas
 * it reads as a smudge. Skipped on the "low" tier, where the renderer applies the same tone mapping.
 * Pair it with `ShadowBlob`, not ContactShadows.
 */
export function Effects({ ao = 1, ref }: { ao?: number; ref?: Ref<Composer | null> }) {
  const quality = useQuality()
  if (quality !== 'high') return null
  return (
    <EffectComposer multisampling={4} ref={ref}>
      <N8AO
        aoRadius={0.32}
        distanceFalloff={0.55}
        intensity={1.9 * ao}
        quality="medium"
        color={SCENE.occlusion}
        halfRes={false}
      />
      <Bloom luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.45} mipmapBlur />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  )
}
