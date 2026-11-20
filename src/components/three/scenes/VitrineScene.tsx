'use client'

import { MeshReflectorMaterial } from '@react-three/drei'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import type { EffectComposer as Composer } from 'postprocessing'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { sizeOf, type CakeConfig } from '@/lib/cake'
import type { Preset } from '@/lib/presets'
import { FROSTING } from '../cake/geometry'
import { Cake } from '../cake/Cake'
import { CakeStand, STAND_HEIGHT } from '../CakeStand'
import { CanvasShell } from '../CanvasShell'
import { CaptureBridge, type Capture } from '../Capture'
import { Effects } from '../Effects'
import { useQuality, useReducedMotionScene } from '../motion'
import { ShadowBlob } from '../ShadowBlob'
import { Studio } from '../Studio'

const TAU = Math.PI * 2
/** Distance from the centre of the turntable to each cake. The front cake sits at the origin. */
const RADIUS = 3.7
const FLOOR = -STAND_HEIGHT
const MOON = new THREE.Color('#8ea2ff')
/** Half the width and the full height of a classic cake on its stand: what the camera keeps in view. */
const CAKE_HALF_WIDTH = 1.45
const CAKE_HEIGHT = 2.5

const smooth = (t: number) => t * t * (3 - 2 * t)

/** Size of the glass cloche that covers a cake on its stand. */
function clocheSize(config: CakeConfig) {
  const tiers = sizeOf(config).tiers
  const radius = tiers[0].radius + FROSTING + 0.16
  const cake = tiers.reduce((sum, tier) => sum + tier.height, 0)
  const extra = config.message ? 0.5 : config.candles ? 0.48 : 0.32
  return { radius, height: cake + extra }
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
  const size = useMemo(() => clocheSize(preset.config), [preset.config])
  const geometry = useMemo(() => clocheGeometry(size.radius, size.height), [size])
  useEffect(() => () => geometry.dispose(), [geometry])
  const standRadius = sizeOf(preset.config).tiers[0].radius + FROSTING

  const cloche = useRef<THREE.Group>(null)
  const glass = useRef<THREE.MeshPhysicalMaterial>(null)
  const spin = useRef<THREE.Group>(null)
  const ring = useRef<THREE.MeshBasicMaterial>(null)
  const lift = useRef(selected ? 1 : 0)

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const goal = selected ? 1 : 0
    lift.current = still ? goal : THREE.MathUtils.damp(lift.current, goal, 3.4, dt)
    const ease = smooth(lift.current)
    if (cloche.current && glass.current) {
      // The cloche rises and fades out of view while the chosen cake is on show.
      cloche.current.position.y = ease * 1.6
      cloche.current.visible = ease < 0.98
      glass.current.opacity = 0.2 * (1 - ease)
    }
    if (ring.current) ring.current.color.copy(MOON).multiplyScalar(0.25 + ease * 2.2)
    const group = spin.current
    if (group) {
      if (selected && !sliced && !still) group.rotation.y += dt * 0.22
      else {
        // Turn back to face the visitor, by the shortest way round.
        const home = Math.round(group.rotation.y / TAU) * TAU
        group.rotation.y = still ? home : THREE.MathUtils.damp(group.rotation.y, home, 4, dt)
      }
    }
  })

  const select = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onSelect()
  }

  return (
    <group
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
            color="#dfe6ff"
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
          <meshPhysicalMaterial color="#e8ecff" roughness={0.1} clearcoat={1} transparent opacity={0.5} />
        </mesh>
      </group>
      <mesh position-y={FLOOR + 0.004} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[standRadius * 0.5, standRadius * 0.5 + 0.025, 96]} />
        <meshBasicMaterial ref={ring} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** The dark lacquered turntable, with a thin line of light around its edge. */
function Turntable() {
  const quality = useQuality()
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
            mixStrength={1.4}
            roughness={0.85}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            color="#0d1027"
            metalness={0.55}
            mirror={0}
          />
        ) : (
          <meshStandardMaterial color="#0d1027" roughness={0.55} metalness={0.4} />
        )}
      </mesh>
      <mesh position-y={0.006} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[radius - 0.03, radius, 192]} />
        <meshBasicMaterial color={MOON.clone().multiplyScalar(1.6)} toneMapped={false} />
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

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    if (shown.current !== index) {
      const wanted = -index * step
      const turn = ((((wanted - goal.current) % TAU) + TAU * 1.5) % TAU) - TAU / 2
      goal.current += turn
      shown.current = index
    }
    angle.current = still ? goal.current : THREE.MathUtils.damp(angle.current, goal.current, 2.6, dt)
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
    camera.position.set(
      THREE.MathUtils.damp(camera.position.x, x, 3, dt),
      THREE.MathUtils.damp(camera.position.y, y, 3, dt),
      THREE.MathUtils.damp(camera.position.z, distance, 3, dt),
    )
    if (scene.fog instanceof THREE.Fog) {
      // The cakes at the back fade into the night, whatever the distance.
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
  const step = TAU / presets.length
  return (
    <CanvasShell
      className="h-full w-full"
      label={`A turning glass vitrine with ${presets.length} cakes on porcelain stands. ${presets[index].name} is at the front, its glass cloche lifted.`}
      camera={{ position: [0, 2.2, 9], fov: 34, near: 0.1, far: 60 }}
    >
      <fog attach="fog" args={['#060814', 11, 19]} />
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
