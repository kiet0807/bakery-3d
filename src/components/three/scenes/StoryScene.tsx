'use client'

import { useProgress } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useRef, type ReactNode, type RefObject } from 'react'
import * as THREE from 'three'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useDict } from '@/i18n/LangProvider'
import { normalizeConfig } from '@/lib/cake'
import { Cake, type CakeControls } from '../cake/Cake'
import { computeLayout } from '../cake/layout'
import { CakeBoard } from '../CakeBoard'
import { CanvasShell } from '../CanvasShell'
import { Cloud } from '../Cloud'
import { Effects } from '../Effects'
import { FloatingSprinkles } from '../FloatingSprinkles'
import { useReducedMotionScene } from '../motion'
import { Studio } from '../Studio'
import { useScene } from '../theme'

/**
 * The cake of the story: pink, glazed in white chocolate, fully dressed. 20 cm has the exact shape of the old
 * "classic" size the camera shots were tuned on.
 */
export const STORY_CAKE = normalizeConfig({
  size: 's20',
  sponge: 'vanilla',
  filling: 'strawberry-jam',
  frosting: 'strawberry-milk',
  drip: 'white-chocolate',
  toppings: ['strawberries', 'macarons', 'cream-kisses', 'gold-leaf'],
})

const STORY_RADIUS = computeLayout(STORY_CAKE).maxRadius

type Vec = [number, number, number]

/**
 * One camera shot per chapter. `shift` moves the cake right on wide screens, leaving room for the text.
 * `portrait` is how much the shot pulls back on tall screens: close-ups of the wide slice need more room than
 * the whole cake does.
 */
const SHOTS: { position: Vec; target: Vec; shift: number; portrait: number }[] = [
  { position: [0, 1.05, 7.6], target: [0, 1.0, 0], shift: 0, portrait: 1.25 },
  // The slice slides out to the front right and turns its cut face towards these two cameras.
  { position: [-1.4, 1.3, 4.56], target: [1.26, 0.5, 1.66], shift: 0.2, portrait: 0.6 },
  { position: [-0.73, 1.19, 3.77], target: [1.26, 0.45, 1.66], shift: 0.2, portrait: 1 },
  { position: [-3.0, 1.25, 3.2], target: [0, 0.55, 0], shift: 0.18, portrait: 1.6 },
  { position: [0.35, 4.3, 1.8], target: [0, 0.85, 0], shift: 0.18, portrait: 1.4 },
  { position: [0, 1.15, 7.4], target: [0, 0.2, 0], shift: 0, portrait: 1.25 },
]

/** Reused every frame instead of allocating new vectors. */
const scratch = {
  position: new THREE.Vector3(),
  target: new THREE.Vector3(),
  a: new THREE.Vector3(),
  b: new THREE.Vector3(),
}

/**
 * How long, after the cake is first drawn, the opening act waits for the café light (the high tier's HDRI,
 * 1.6 MB) before it plays anyway: on a slow line the glaze should not pour under one light and finish under
 * another, but a stalled download must not hold the cake bare forever.
 */
const LIGHT_WAIT = 4

/** Frames the canvas draws before it fades in (CanvasReady in CanvasShell counts the same three). */
const FIRST_FRAMES = 3

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
  startedAt,
  onReady,
  children,
}: {
  chapterRef: RefObject<number>
  started: boolean
  /** When the opening act began, kept outside the canvas so a rebuilt canvas (light tier) does not replay it. */
  startedAt: RefObject<number | null>
  /** Called once the cake is on screen in its final light, ready for the opening act. */
  onReady: () => void
  /** Rendered next to the cake, inside the same bobbing group (the cloud it rests on). */
  children?: ReactNode
}) {
  const camera = useThree((state) => state.camera)
  const still = useReducedMotionScene()
  const chapter = useRef(0)
  const controls = useRef<CakeControls>({ slice: 0, drips: 0, toppings: 0 })
  // The visitor may come in long before the scene is there (the welcome screen no longer waits for it), so
  // the opening act's clock starts when the cake can really be seen: after the frames the canvas draws before
  // it fades in, and once the café light has arrived (or LIGHT_WAIT has passed). Until then the cake waits,
  // bare, under the stage's "almost out of the oven" note.
  const frames = useRef(0)
  const drawnAt = useRef<number | null>(null)
  const ready = useRef(false)

  useEffect(() => () => (camera as THREE.PerspectiveCamera).clearViewOffset(), [camera])

  // Asked for less motion, the scene draws only when something changes: the page scrolls, the story starts, or the
  // cake is still on its way in. A few frames, not one: the page works out the chapter in a frame of its own.
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => {
    if (!still) return
    const draw = () => invalidate(3)
    draw()
    window.addEventListener('scroll', draw, { passive: true })
    return () => window.removeEventListener('scroll', draw)
  }, [still, started, invalidate])

  useFrame((state, delta) => {
    const { size } = state
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
    const pullBack = aspect < 1 ? 1 + (1 - aspect) * THREE.MathUtils.lerp(from.portrait, to.portrait, f) : 1
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
    // The slice comes out for the two chapters inside the cake, and is home before the glaze pours over the cut.
    c.slice = smooth(range(ch, 0.35, 1)) * (1 - smooth(range(ch, 2.15, 2.6)))
    // Glaze and toppings step aside while we are inside, then return in their own chapters:
    // the glaze pours again in "The finish" (3), the toppings land again in "The crown" (4).
    const dripsByScroll = Math.max(1 - range(ch, 0.3, 0.75), range(ch, 2.55, 3))
    const toppingsByScroll = Math.max(1 - range(ch, 0.3, 0.75), range(ch, 3.3, 4))
    const now = performance.now() / 1000
    if (!ready.current) {
      if (still) state.invalidate()
      frames.current += 1
      if (frames.current >= FIRST_FRAMES) drawnAt.current ??= now
      // drei's loading store is global; on the home page this canvas is the only thing loading.
      const lit = !useProgress.getState().active
      if (drawnAt.current !== null && (lit || now - drawnAt.current > LIGHT_WAIT)) {
        ready.current = true
        onReady()
      }
    }
    // Opening act, once the visitor presses Start and the cake is ready: the glaze pours, then the toppings land.
    let dripsIntro = 0
    let toppingsIntro = 0
    if (started && still) {
      dripsIntro = 1
      toppingsIntro = 1
    } else if (started && (ready.current || startedAt.current !== null)) {
      startedAt.current ??= now
      const t = now - startedAt.current
      dripsIntro = range(t, 0.4, 1.8)
      toppingsIntro = range(t, 1.2, 2.1)
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
  onReady,
}: {
  chapterRef: RefObject<number>
  started: boolean
  onProgress: (percent: number) => void
  /** The cake is on screen and lit (or the 2D drawing stands in for it): the stage can stop saying "loading". */
  onReady: () => void
}) {
  const { scenes } = useDict()
  const { cloud } = useScene()
  const startedAt = useRef<number | null>(null)
  const reduced = useReducedMotion()
  // Without WebGL the 2D drawing is all there is to load.
  const done = useCallback(() => {
    onProgress(100)
    onReady()
  }, [onProgress, onReady])
  return (
    <CanvasShell
      className="h-full w-full"
      label={scenes.story}
      camera={{ position: [0, 1.2, 7.8], fov: 32, near: 0.1, far: 120 }}
      mode={reduced ? 'demand' : 'always'}
      onFallback={done}
    >
      <LoadingReporter onProgress={onProgress} />
      {/* The story's cameras skim the white glaze from low down: there it has to mirror the bright page. */}
      <Studio horizon={0.72} />
      <FloatingSprinkles count={80} />
      <Director chapterRef={chapterRef} started={started} startedAt={startedAt} onReady={onReady}>
        <CakeBoard radius={STORY_RADIUS} />
        <Cloud
          seed={3}
          puffs={40}
          width={2.1}
          height={0.36}
          depth={1.6}
          position={[0, -0.62, 0]}
          rest={{ radius: STORY_RADIUS, y: 0.62 - 0.03 }}
          color={cloud.near}
        />
      </Director>
      <Cloud
        seed={11}
        puffs={22}
        width={1.6}
        height={0.5}
        depth={1}
        position={[-5.4, -1.5, -4]}
        color={cloud.far}
      />
      <Cloud
        seed={19}
        puffs={20}
        width={1.4}
        height={0.45}
        depth={0.9}
        position={[5.8, -0.6, -6]}
        color={cloud.peach}
      />
      <Cloud
        seed={27}
        puffs={18}
        width={1.2}
        height={0.4}
        depth={0.8}
        position={[-7.5, 3.4, -12]}
        color={cloud.far}
      />
      <Cloud
        seed={41}
        puffs={16}
        width={1}
        height={0.35}
        depth={0.7}
        position={[3.9, -2.3, 1.2]}
        scale={0.8}
        color={cloud.near}
      />
      <Effects />
    </CanvasShell>
  )
}
