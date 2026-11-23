'use client'

import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode, type EffectComposer as Composer } from 'postprocessing'
import type { Ref } from 'react'
import * as THREE from 'three'
import { useQuality } from './motion'
import { useScene } from './theme'

/**
 * Only light brighter than this blooms. In this daylight scene sunlit white board and porcelain go well past 1
 * (a threshold of 1.4 still haloed the box and washed its print out); candle flames are drawn far brighter
 * (`FLAME_HDR` in Toppings) so they are the only thing that glows.
 */
export const BLOOM_FROM = 2.5

const drawn = new THREE.Vector2()

/**
 * Keeps the renderer at its own canvas's size. @react-three/postprocessing sizes a composer it builds from one size
 * shared by every composer on the page (a variable written at each render), and the composer resizes the renderer
 * to it. Next.js keeps a page left behind (hidden) and builds its composer again when the page shows: coming back
 * to the builder from the vitrine, the builder's renderer took the vitrine's whole-screen size and kept it, the
 * cake drawn twice as big and cut in half. Checked each frame before the composer draws (which then follows).
 */
function OwnSize() {
  useFrame(({ gl, size }) => {
    gl.getSize(drawn)
    if (drawn.x !== size.width || drawn.y !== size.height) gl.setSize(size.width, size.height)
  })
  return null
}

/**
 * The photographic finish: warm ambient occlusion so toppings sit in the cream instead of floating on it, a
 * small bloom kept for candle flames only (see BLOOM_FROM), and neutral tone mapping, which keeps pastel
 * frosting the colour the customer picked (filmic curves grey it out on a light page). No vignette: on a bright,
 * transparent canvas it reads as a smudge. Skipped on the "low" tier, where the renderer applies the same tone mapping.
 * Pair it with `ShadowBlob`, not ContactShadows.
 */
export function Effects({ ao = 1, ref }: { ao?: number; ref?: Ref<Composer | null> }) {
  const quality = useQuality()
  const { occlusion } = useScene()
  if (quality !== 'high') return null
  return (
    <>
      <OwnSize />
      <EffectComposer multisampling={4} ref={ref}>
        <N8AO
          aoRadius={0.32}
          distanceFalloff={0.55}
          intensity={1.9 * ao}
          quality="medium"
          color={occlusion}
          halfRes={false}
        />
        <Bloom luminanceThreshold={BLOOM_FROM} luminanceSmoothing={0.2} intensity={0.45} mipmapBlur />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      </EffectComposer>
    </>
  )
}
