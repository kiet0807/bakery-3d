'use client'

import { Stars, useProgress } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import * as THREE from 'three'
import { normalizeConfig } from '@/lib/cake'
import { Cake, type CakeControls } from '../cake/Cake'
import { CanvasShell } from '../CanvasShell'
import { Cloud } from '../Cloud'
import { Effects } from '../Effects'
import { FloatingSprinkles } from '../FloatingSprinkles'
import { useReducedMotionScene } from '../motion'
import { Studio } from '../Studio'

/** The cake of the story: pink, glazed in white chocolate, fully dressed. */
export const STORY_CAKE = normalizeConfig({
  size: 'classic',
  sponge: 'vanilla',
  filling: 'strawberry-jam',
  frosting: 'strawberry-milk',
  drip: 'white-chocolate',
  toppings: ['strawberries', 'macarons', 'cream-kisses', 'gold-leaf'],
})

type Vec = [number, number, number]

/** One camera shot per chapter. `shift` moves the cake right on wide screens, leaving room for the text. */
const SHOTS: { position: Vec; target: Vec; shift: number }[] = [
  { position: [0, 1.05, 7.6], target: [0, 1.0, 0], shift: 0 },
  // The slice slides out to the front right and turns its cut face towards these two cameras.
  { position: [-0.25, 0.95, 3.3], target: [1.26, 0.5, 1.66], shift: 0.2 },
  { position: [0.47, 0.74, 2.5], target: [1.26, 0.45, 1.66], shift: 0.2 },
  { position: [-3.0, 1.25, 3.2], target: [0, 0.55, 0], shift: 0.18 },
  { position: [0.35, 4.3, 1.8], target: [0, 0.85, 0], shift: 0.18 },
  { position: [0, 1.15, 7.4], target: [0, 0.2, 0], shift: 0 },
]

/** Reused every frame instead of allocating new vectors. */
const scratch = {
  position: new THREE.Vector3(),
  target: new THREE.Vector3(),
  a: new THREE.Vector3(),
  b: new THREE.Vector3(),
}

const smooth = (t: number) => t * t * (3 - 2 * t)
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
const range = (t: number, from: number, to: number) => clamp01((t - from) / (to - from))

/**
 * Moves the camera between shots as the story scrolls, and drives the slice, drips and toppings of the cake
 * it renders. It owns the cake's controls, so all frame-by-frame writes stay inside one component.
 */
function Director({
  chapterRef,
  started,
  children,
}: {
  chapterRef: RefObject<number>
  started: boolean
  /** Rendered next to the cake, inside the same bobbing group (the cloud it rests on). */
  children?: ReactNode
}) {
  const camera = useThree((state) => state.camera)
  const still = useReducedMotionScene()
  const chapter = useRef(0)
  const startedAt = useRef<number | null>(null)
  const controls = useRef<CakeControls>({ slice: 0, drips: 0, toppings: 0 })

  useEffect(() => () => (camera as THREE.PerspectiveCamera).clearViewOffset(), [camera])

  useFrame((state, delta) => {
    const { clock, size } = state
    const view = state.camera as THREE.PerspectiveCamera
    const { position, target, a, b } = scratch
    chapter.current = still
      ? chapterRef.current
      : THREE.MathUtils.damp(chapter.current, chapterRef.current, 3.2, Math.min(delta, 0.05))
    const ch = Math.min(SHOTS.length - 1, Math.max(0, chapter.current))
    const i = Math.min(SHOTS.length - 2, Math.floor(ch))
    const f = smooth(ch - i)
    const from = SHOTS[i]
    const to = SHOTS[i + 1]

    const aspect = size.width / size.height
    // Pull back on tall screens so the cake still fits across.
    const pullBack = aspect < 1 ? 1 + (1 - aspect) * 1.25 : 1
    target.copy(a.fromArray(from.target).lerp(b.fromArray(to.target), f))
    position
      .copy(a.fromArray(from.position).lerp(b.fromArray(to.position), f))
      .sub(target)
      .multiplyScalar(pullBack)
      .add(target)
    view.position.copy(position)
    view.lookAt(target)
    const shift = aspect > 1.1 ? THREE.MathUtils.lerp(from.shift, to.shift, f) : 0
    view.setViewOffset(size.width, size.height, -shift * size.width, 0, size.width, size.height)

    const c = controls.current
    // The slice comes out for the two chapters inside the cake.
    c.slice = smooth(range(ch, 0.35, 1)) * (1 - smooth(range(ch, 2.25, 2.9)))
    // Glaze and toppings step aside while we are inside, then return in their own chapters:
    // the glaze pours again in "The finish" (3), the toppings land again in "The crown" (4).
    const dripsByScroll = Math.max(1 - range(ch, 0.3, 0.75), range(ch, 2.35, 3))
    const toppingsByScroll = Math.max(1 - range(ch, 0.3, 0.75), range(ch, 3.3, 4))
    // Opening act, once the visitor presses Start: the glaze pours, then the toppings land.
    let dripsIntro = 0
    let toppingsIntro = 0
    if (started && still) {
      dripsIntro = 1
      toppingsIntro = 1
    } else if (started) {
      startedAt.current ??= clock.elapsedTime
      const t = clock.elapsedTime - startedAt.current
      dripsIntro = range(t, 0.4, 1.8)
      toppingsIntro = range(t, 1.2, 2.6)
    }
    c.drips = Math.min(dripsIntro, dripsByScroll)
    c.toppings = Math.min(toppingsIntro, toppingsByScroll)
  })
  return (
    <Bob>
      <Cake config={STORY_CAKE} controls={controls} sliceReach={1.5} sliceAngle={0.6} sliceTurn={1.25} />
      {children}
    </Bob>
  )
}

function LoadingReporter({ onProgress }: { onProgress: (percent: number) => void }) {
  const { active, progress } = useProgress()
  useEffect(() => {
    onProgress(active ? Math.round(progress) : 100)
  }, [active, progress, onProgress])
  return null
}

function Bob({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null)
  const still = useReducedMotionScene()
  useFrame(({ clock }) => {
    if (!group.current || still) return
    group.current.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.035
    group.current.rotation.y = Math.sin(clock.elapsedTime * 0.25) * 0.06
  })
  return <group ref={group}>{children}</group>
}

export default function StoryScene({
  chapterRef,
  started,
  onProgress,
}: {
  chapterRef: RefObject<number>
  started: boolean
  onProgress: (percent: number) => void
}) {
  return (
    <CanvasShell
      className="h-full w-full"
      label="A strawberry layer cake resting on a cloud under the night sky. As the page scrolls the camera moves around it and a slice slides out to show the layers inside."
      camera={{ position: [0, 1.2, 7.8], fov: 32, near: 0.1, far: 120 }}
    >
      <LoadingReporter onProgress={onProgress} />
      <Studio floor={-0.4} shadows={false} />
      <Stars radius={70} depth={40} count={2200} factor={3.2} saturation={0} fade speed={0.4} />
      <FloatingSprinkles count={80} />
      <Director chapterRef={chapterRef} started={started}>
        <Cloud
          seed={3}
          puffs={34}
          width={1.75}
          height={0.36}
          depth={1.55}
          position={[0, -0.62, 0]}
          color="#a4a7c6"
        />
      </Director>
      <Cloud
        seed={11}
        puffs={22}
        width={1.6}
        height={0.5}
        depth={1}
        position={[-5.4, -1.5, -4]}
        color="#8a8db0"
      />
      <Cloud
        seed={19}
        puffs={20}
        width={1.4}
        height={0.45}
        depth={0.9}
        position={[5.8, -0.6, -6]}
        color="#8a8db0"
      />
      <Cloud
        seed={27}
        puffs={18}
        width={1.2}
        height={0.4}
        depth={0.8}
        position={[-7.5, 3.4, -12]}
        color="#787c9f"
      />
      <Cloud
        seed={41}
        puffs={16}
        width={1}
        height={0.35}
        depth={0.7}
        position={[3.9, -2.3, 1.2]}
        scale={0.8}
        color="#9497b8"
      />
      <Effects />
    </CanvasShell>
  )
}
