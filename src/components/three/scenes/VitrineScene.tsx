'use client'

import { MeshReflectorMaterial } from '@react-three/drei'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import type { EffectComposer as Composer } from 'postprocessing'
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { sizeOf, type CakeConfig } from '@/lib/cake'
import { useDict } from '@/i18n/LangProvider'
import type { Preset } from '@/lib/presets'
import { FROSTING } from '../cake/geometry'
import { Cake } from '../cake/Cake'
import { headroom } from '../cake/layout'
import { CakeStand, STAND_HEIGHT } from '../CakeStand'
import { CanvasShell } from '../CanvasShell'
import { CaptureBridge, type Capture } from '../Capture'
import { Effects } from '../Effects'
import { useQuality, useReducedMotionScene } from '../motion'
import { ShadowBlob } from '../ShadowBlob'
import { Studio } from '../Studio'
import { useScene } from '../theme'

const TAU = Math.PI * 2
/** Distance from the centre of the turntable to each cake. The front cake sits at the origin. */
const RADIUS = 3.7
const FLOOR = -STAND_HEIGHT
/** On the light tier, cakes further back than this (world z) are not drawn: the fog hides them anyway. */
const BACK_CUTOFF = -RADIUS * 1.2
/** Half the width and the full height of a classic cake on its stand: what the camera keeps in view. */
const CAKE_HALF_WIDTH = 1.45
const CAKE_HEIGHT = 2.5

const smooth = (t: number) => t * t * (3 - 2 * t)

/**
 * The vitrine renders on demand. Its idle motion (the chosen cake's slow turn, about 13° a second, and candle
 * flames) is drawn at this rate, which reads as smooth as 60 for something that slow and halves the cost of the
 * page's longest state (a quarter of it on a 120 Hz screen, which drew 120 frames a second). The table turning,
 * the camera following the pointer and the cloche lifting ask for every frame while they move.
 */
const IDLE_FPS = 30
/** Below this a damped value counts as arrived: it is set to its goal and stops asking for frames. */
const SETTLED = 1e-4

/**
 * The table's reflection is rendered from a camera below it that sees layer 0 only. Toppings sit on top of the
 * cakes, where that camera cannot see them past the cakes themselves (measured: the picture does not change by
 * more than 3 of 255 in any pixel), yet they were more than half of its draw calls (145 of 254). On this layer they are left out of
 * the reflection; the scene's camera, the shadow pass and saved pictures still see them.
 */
const NOT_REFLECTED = 1

/** Size of the glass cloche that covers a cake on its stand. */
function clocheSize(config: CakeConfig) {
  const tiers = sizeOf(config).tiers
  const radius = tiers[0].radius + FROSTING + 0.16
  const cake = tiers.reduce((sum, tier) => sum + tier.height, 0)
  return { radius, height: cake + headroom(config) + 0.09 }
}

/** A bell of glass: straight walls, a rounded shoulder and a small knob, turned on a lathe. */
function clocheGeometry(radius: number, height: number) {
  const shoulder = radius * 0.55
  const points: THREE.Vector2[] = [new THREE.Vector2(radius + 0.03, 0), new THREE.Vector2(radius, 0.02)]
  points.push(new THREE.Vector2(radius, height - shoulder))
  const steps = 14
  for (let i = 1; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2)
    points.push(new THREE.Vector2(Math.cos(a) * radius, height - shoulder + Math.sin(a) * shoulder))
  }
  return new THREE.LatheGeometry(points, 72)
}

/** One cake of the vitrine: stand, cake, glass cloche and the ring of light that marks the chosen one. */
function Showcase({
  preset,
  angle,
  selected,
  sliced,
  onSelect,
}: {
  preset: Preset
  angle: number
  selected: boolean
  sliced: boolean
  onSelect: () => void
}) {
  const still = useReducedMotionScene()
  const low = useQuality() === 'low'
  const { table, glass: glassColours } = useScene()
  // The ring under each cake blends from the rest colour to the chosen one as it comes to the front.
  const marks = useMemo(
    () => ({ rest: new THREE.Color(table.markRest), chosen: new THREE.Color(table.markChosen) }),
    [table],
  )
  const size = useMemo(() => clocheSize(preset.config), [preset.config])
  const geometry = useMemo(() => clocheGeometry(size.radius, size.height), [size])
  useEffect(() => () => geometry.dispose(), [geometry])
  const standRadius = sizeOf(preset.config).tiers[0].radius + FROSTING

  const root = useRef<THREE.Group>(null)
  const where = useMemo(() => new THREE.Vector3(), [])
  const cloche = useRef<THREE.Group>(null)
  const glass = useRef<THREE.MeshPhysicalMaterial>(null)
  const spin = useRef<THREE.Group>(null)
  const ring = useRef<THREE.MeshBasicMaterial>(null)
  const lift = useRef(selected ? 1 : 0)

  const invalidate = useThree((state) => state.invalidate)
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const goal = selected ? 1 : 0
    lift.current = still ? goal : THREE.MathUtils.damp(lift.current, goal, 3.4, dt)
    if (Math.abs(lift.current - goal) < SETTLED) lift.current = goal
    else invalidate()
    const ease = smooth(lift.current)
    if (cloche.current && glass.current) {
      // The cloche rises and fades out of view while the chosen cake is on show.
      cloche.current.position.y = ease * 1.6
      cloche.current.visible = ease < 0.98
      glass.current.opacity = 0.2 * (1 - ease)
    }
    if (ring.current) ring.current.color.copy(marks.rest).lerp(marks.chosen, ease)
    if (root.current) {
      // Slow devices skip the cakes at the back of the table (about half of the draw calls).
      root.current.visible = !low || root.current.getWorldPosition(where).z > BACK_CUTOFF
    }
    const group = spin.current
    if (group) {
      if (selected && !sliced && !still) group.rotation.y += dt * 0.22
      else {
        // Turn back to face the visitor, by the shortest way round.
        const home = Math.round(group.rotation.y / TAU) * TAU
        group.rotation.y = still ? home : THREE.MathUtils.damp(group.rotation.y, home, 4, dt)
        if (Math.abs(group.rotation.y - home) < SETTLED) group.rotation.y = home
        else invalidate()
      }
    }
  })

  const select = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onSelect()
  }

  return (
    <group
      ref={root}
      position={[Math.sin(angle) * RADIUS, 0, Math.cos(angle) * RADIUS]}
      rotation-y={angle}
      onClick={select}
      onPointerOver={(event) => {
        event.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = ''
      }}
    >
      <CakeStand radius={standRadius} />
      <ShadowBlob radius={standRadius + 0.7} y={FLOOR} opacity={0.9} />
      <group ref={spin}>
        <Cake config={preset.config} light sliced={selected && sliced} />
      </group>
      <group ref={cloche}>
        <mesh geometry={geometry} renderOrder={2}>
          <meshPhysicalMaterial
            ref={glass}
            color={glassColours.body}
            roughness={0.04}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.05}
            envMapIntensity={1.6}
            transparent
            opacity={0.2}
            depthWrite={false}
          />
        </mesh>
        <mesh position-y={size.height + 0.05}>
          <sphereGeometry args={[0.07, 20, 14]} />
          <meshPhysicalMaterial
            color={glassColours.knob}
            roughness={0.1}
            clearcoat={1}
            transparent
            opacity={0.6}
          />
        </mesh>
      </group>
      <mesh position-y={FLOOR + 0.004} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[standRadius * 0.5, standRadius * 0.5 + 0.035, 96]} />
        <meshBasicMaterial ref={ring} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** A porcelain turntable with a mint line around its edge, like the trim on a cake box. */
function Turntable() {
  const quality = useQuality()
  const { table } = useScene()
  const radius = RADIUS + 1.9
  return (
    <group position-y={FLOOR}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[radius, 128]} />
        {quality === 'high' ? (
          <MeshReflectorMaterial
            blur={[320, 90]}
            resolution={512}
            mixBlur={1}
            mixStrength={0.55}
            roughness={0.7}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            color={table.top}
            metalness={0.05}
            mirror={0}
          />
        ) : (
          <meshStandardMaterial color={table.top} roughness={0.5} metalness={0} />
        )}
      </mesh>
      <mesh position-y={0.006} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[radius - 0.06, radius, 192]} />
        <meshBasicMaterial color={table.rim} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Turns the table so the chosen cake comes to the front, the short way round, and keeps the camera framed. */
function Rig({ index, count, children }: { index: number; count: number; children: React.ReactNode }) {
  const still = useReducedMotionScene()
  const table = useRef<THREE.Group>(null)
  const step = TAU / count
  const angle = useRef(-index * step)
  const goal = useRef(-index * step)
  const shown = useRef(index)
  const look = useMemo(() => new THREE.Vector3(), [])
  const aim = useMemo(() => new THREE.Vector3(), [])
  const invalidate = useThree((state) => state.invalidate)
  // The element the pointer is read from: over the page's text columns it does not move, nor does the camera.
  const source = useThree((state) => state.events.connected) as EventTarget | null | undefined
  // A new cake to bring round, or the pointer moving (the camera drifts after it): frames until it has settled.
  useEffect(() => invalidate(), [index, invalidate])
  useEffect(() => {
    if (still || !source) return
    const wake = () => invalidate()
    source.addEventListener('pointermove', wake, { passive: true })
    return () => source.removeEventListener('pointermove', wake)
  }, [still, source, invalidate])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    if (shown.current !== index) {
      const wanted = -index * step
      const turn = ((((wanted - goal.current) % TAU) + TAU * 1.5) % TAU) - TAU / 2
      goal.current += turn
      shown.current = index
    }
    angle.current = still ? goal.current : THREE.MathUtils.damp(angle.current, goal.current, 2.6, dt)
    if (Math.abs(angle.current - goal.current) < SETTLED) angle.current = goal.current
    else invalidate()
    if (table.current) table.current.rotation.y = angle.current

    // Frame the front cake. On wide screens the stage runs behind the side columns, so the cake only gets the
    // middle third; on phones it gets most of the width. Then drift a little with the pointer.
    const { camera, size, pointer, scene } = state
    const view = camera as THREE.PerspectiveCamera
    const aspect = size.width / size.height
    const tan = Math.tan(THREE.MathUtils.degToRad(view.fov / 2))
    const share = size.width >= 1280 ? 0.32 : 0.8
    const distance = Math.max(CAKE_HALF_WIDTH / share / (tan * aspect), CAKE_HEIGHT / 0.62 / 2 / tan)
    const x = still ? 0 : pointer.x * 0.35
    const y = 0.45 + distance * 0.2 + (still ? 0 : pointer.y * 0.15)
    const goalCamera = aim.set(x, y, distance)
    if (camera.position.distanceTo(goalCamera) < SETTLED) camera.position.copy(goalCamera)
    else {
      camera.position.set(
        THREE.MathUtils.damp(camera.position.x, x, 3, dt),
        THREE.MathUtils.damp(camera.position.y, y, 3, dt),
        THREE.MathUtils.damp(camera.position.z, distance, 3, dt),
      )
      invalidate()
    }
    if (scene.fog instanceof THREE.Fog) {
      // The cakes at the back fade into the page's cream, whatever the distance.
      scene.fog.near = distance + 2
      scene.fog.far = distance + 10
    }
    camera.lookAt(look.set(0, 0.5, 0))
  })

  return (
    <group position-z={-RADIUS}>
      <group ref={table}>{children}</group>
    </group>
  )
}

/** Draws the idle motion at IDLE_FPS, in step with the screen's refresh. Off under reduced motion: nothing idles. */
function IdlePace() {
  const invalidate = useThree((state) => state.invalidate)
  const still = useReducedMotionScene()
  useEffect(() => {
    if (still) return
    const interval = 1000 / IDLE_FPS
    let last = 0
    let frame = requestAnimationFrame(function tick(now) {
      // A few milliseconds of slack, so a 60 Hz screen draws every second refresh rather than every third.
      if (now - last >= interval - 4) {
        last = now
        invalidate()
      }
      frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [still, invalidate])
  return null
}

/**
 * Puts every topping on NOT_REFLECTED and lets the scene's camera see that layer. Toppings are all mounted with
 * their cakes (the vitrine's designs never change), so a look every 30 drawn frames only catches stragglers.
 */
function ToppingsOutOfReflection() {
  const camera = useThree((state) => state.camera)
  const scene = useThree((state) => state.scene)
  // Only the high tier has the reflective table.
  const high = useQuality() === 'high'
  const frames = useRef(0)
  useLayoutEffect(() => {
    if (!high) return
    camera.layers.enable(NOT_REFLECTED)
    return () => camera.layers.disable(NOT_REFLECTED)
  }, [camera, high])
  useFrame(() => {
    if (!high || frames.current++ % 30) return
    scene.traverse((object) => {
      if (object.name === 'toppings') object.traverse((child) => child.layers.set(NOT_REFLECTED))
    })
  })
  return null
}

/** A new colour set (lights, fog, table, rings) is drawn at once, even with nothing idling (reduced motion). */
function RedrawOnPalette() {
  const invalidate = useThree((state) => state.invalidate)
  const colours = useScene()
  useEffect(() => invalidate(), [colours, invalidate])
  return null
}

export default function VitrineScene({
  presets,
  index,
  sliced,
  onSelect,
  captureRef,
}: {
  presets: Preset[]
  index: number
  sliced: boolean
  onSelect: (index: number) => void
  captureRef: RefObject<Capture | null>
}) {
  const composer = useRef<Composer | null>(null)
  const dict = useDict()
  const { page } = useScene()
  const presetLabel = dict.cake.presets[presets[index].id].name
  const step = TAU / presets.length
  return (
    <CanvasShell
      className="h-full w-full"
      label={dict.scenes.vitrine(presets.length, presetLabel)}
      poster={dict.menu.loading}
      camera={{ position: [0, 2.2, 9], fov: 34, near: 0.1, far: 60 }}
      lowDpr={1}
      mode="demand"
    >
      <IdlePace />
      <RedrawOnPalette />
      {/* Fixed args and the colour as a prop: a palette change recolours the fog instead of replacing it. */}
      <fog attach="fog" args={['#ffffff', 11, 19]} color={page} />
      <Studio floor={FLOOR} shadows={false} />
      <Rig index={index} count={presets.length}>
        <Turntable />
        {presets.map((preset, i) => (
          <Showcase
            key={preset.id}
            preset={preset}
            angle={i * step}
            selected={i === index}
            sliced={sliced}
            onSelect={() => onSelect(i)}
          />
        ))}
      </Rig>
      <Effects ref={composer} />
      <ToppingsOutOfReflection />
      <CaptureBridge captureRef={captureRef} composerRef={composer} crop={0.72} />
      <ResetCursor />
    </CanvasShell>
  )
}

/** Leaves the pointer as it was when the scene goes away while hovering a cake. */
function ResetCursor() {
  const gl = useThree((state) => state.gl)
  useEffect(() => () => void (document.body.style.cursor = ''), [gl])
  return null
}
