'use client'

import { Bloom, EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode, type EffectComposer as Composer } from 'postprocessing'
import type { Ref } from 'react'
import { useQuality } from './motion'
import { SCENE } from './theme'

/**
 * Only light brighter than this blooms. In this daylight scene sunlit white board and porcelain go well past 1
 * (a threshold of 1.4 still haloed the box and washed its print out); candle flames are drawn far brighter
 * (`FLAME_HDR` in Toppings) so they are the only thing that glows.
 */
export const BLOOM_FROM = 2.5

/**
 * The photographic finish: warm ambient occlusion so toppings sit in the cream instead of floating on it, a
 * small bloom kept for candle flames only (see BLOOM_FROM), and neutral tone mapping, which keeps pastel
 * frosting the colour the customer picked (filmic curves grey it out on a light page). No vignette: on a bright,
 * transparent canvas it reads as a smudge. Skipped on the "low" tier, where the renderer applies the same tone mapping.
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
      <Bloom luminanceThreshold={BLOOM_FROM} luminanceSmoothing={0.2} intensity={0.45} mipmapBlur />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  )
}
