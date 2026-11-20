'use client'

import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { sizeOf, type CakeConfig } from '@/lib/cake'
import { FROSTING } from '../cake/geometry'
import { Cake } from '../cake/Cake'
import { CanvasShell } from '../CanvasShell'
import { Effects } from '../Effects'
import { useReducedMotionScene } from '../motion'
import { ShadowBlob } from '../ShadowBlob'
import { Studio } from '../Studio'

/** Board thickness. */
const T = 0.025
const BOARD = '#f0eee9'
const RIBBON = '#ff8ab4'
const INK = '#5b7cff'
/** Seconds from the start until everything has landed; the box then only turns. */
const END = 3.9
const OPEN = Math.PI / 2
const SIDES = [0, Math.PI / 2, Math.PI, -Math.PI / 2]
/** The ribbon is tied off-centre, towards the back right, leaving the front of the lid for the name. */
const RIBBON_X = 0.28
const RIBBON_Z = -0.22

const smooth = (t: number) => t * t * (3 - 2 * t)
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
const range = (t: number, from: number, to: number) => clamp01((t - from) / (to - from))
const settle = (t: number) => 1 - Math.pow(1 - t, 3)
/** Overshoots a little before settling, for the bow. */
const pop = (t: number) => {
  const c = 1.9
  return t <= 0 ? 0 : 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

/** Box size for a cake: room around the bottom tier, and headroom for candles or the message plaque. */
export function boxSize(config: CakeConfig) {
  const tiers = sizeOf(config).tiers
  const width = 2 * (tiers[0].radius + FROSTING) + 0.3
  const cake = tiers.reduce((sum, tier) => sum + tier.height, 0)
  const height = cake + (config.message ? 0.42 : config.candles ? 0.4 : 0.22) + 0.1
  return { width, height }
}

/** Camera distance at which a subject of this half-width and height fits the view. */
function fitDistance(camera: THREE.PerspectiveCamera, aspect: number, radius: number, height: number) {
  const vertical = THREE.MathUtils.degToRad(camera.fov)
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * aspect)
  return Math.max(height / 2 / Math.tan(vertical / 2), radius / Math.tan(horizontal / 2))
}

function Board({ size }: { size: [number, number, number] }) {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={BOARD} roughness={0.78} />
    </mesh>
  )
}

/** A ribbon band down one outer side; it grows from the lid towards the table. */
function SideBand({
  width,
  height,
  angle,
  offset,
  bandRef,
}: {
  width: number
  height: number
  angle: number
  /** Sideways position on that face, in the face's own frame. */
  offset: number
  bandRef: (node: THREE.Group | null) => void
}) {
  return (
    <group rotation-y={angle}>
      <group ref={bandRef} position={[offset, height + T, width / 2 + 0.004]}>
        <mesh position-y={-(height + T) / 2}>
          <boxGeometry args={[0.14, height + T, 0.006]} />
          <meshPhysicalMaterial color={RIBBON} roughness={0.35} sheen={1} sheenColor="#ffd1e2" />
        </mesh>
      </group>
    </group>
  )
}

function Bow({ y, bowRef }: { y: number; bowRef: (node: THREE.Group | null) => void }) {
  return (
    <group ref={bowRef} position-y={y}>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.17, 0.1, 0]}
          rotation={[0, 0, side * -0.55]}
          scale={[1, 0.72, 0.55]}
          castShadow
        >
          <torusGeometry args={[0.15, 0.042, 14, 40]} />
          <meshPhysicalMaterial color={RIBBON} roughness={0.35} sheen={1} sheenColor="#ffd1e2" />
        </mesh>
      ))}
      <mesh position-y={0.045} castShadow>
        <sphereGeometry args={[0.065, 20, 16]} />
        <meshPhysicalMaterial color={RIBBON} roughness={0.35} sheen={1} sheenColor="#ffd1e2" />
      </mesh>
    </group>
  )
}

/**
 * The closing scene: the cake lowers onto the board, the four sides fold up, the lid closes, and a ribbon
 * ties it all up. Driven by the time since the scene appeared; with reduced motion it starts at the end.
 */
function FoldingBox({ config }: { config: CakeConfig }) {
  const still = useReducedMotionScene()
  const { width: W, height: H } = useMemo(() => boxSize(config), [config])
  const startedAt = useRef<number | null>(null)
  const turn = useRef<THREE.Group>(null)
  const cake = useRef<THREE.Group>(null)
  const folds = useRef<(THREE.Group | null)[]>([])
  const lid = useRef<THREE.Group>(null)
  const lidBands = useRef<THREE.Group>(null)
  const sideBands = useRef<(THREE.Group | null)[]>([])
  const bow = useRef<THREE.Group>(null)
  const look = useMemo(() => new THREE.Vector3(), [])
  const rx = W * RIBBON_X
  const rz = W * RIBBON_Z
  // Where the ribbon crosses each face, in that face's frame (front, right, back, left).
  const bandOffsets = [rx, -rz, -rx, rz]
  /** The flat, open net is wider than the closed box: the camera starts further back. */
  const netRadius = W / 2 + H * 0.95
  const boxRadius = W * 0.78

  useFrame((state, delta) => {
    startedAt.current ??= state.clock.elapsedTime
    const t = still ? END : state.clock.elapsedTime - startedAt.current

    if (cake.current) cake.current.position.y = (1 - settle(range(t, 0, 0.9))) * (H + 0.5)
    const foldTimes: [number, number][] = [
      [0.9, 1.5],
      [1.1, 1.7],
      [1.5, 2.1],
      [1.3, 1.9],
    ]
    folds.current.forEach((pivot, i) => {
      if (pivot) pivot.rotation.x = OPEN * (1 - smooth(range(t, ...foldTimes[i])))
    })
    if (lid.current) lid.current.rotation.x = OPEN * (1 - smooth(range(t, 2.2, 2.9)))

    const across = Math.max(0.001, settle(range(t, 2.9, 3.2)))
    if (lidBands.current) {
      lidBands.current.visible = t > 2.9
      lidBands.current.scale.set(across, 1, across)
    }
    const down = Math.max(0.001, settle(range(t, 3.05, 3.45)))
    sideBands.current.forEach((band) => {
      if (!band) return
      band.visible = t > 3.05
      band.scale.y = down
    })
    if (bow.current) {
      const b = range(t, 3.3, END)
      bow.current.visible = b > 0
      bow.current.scale.setScalar(Math.max(0.001, pop(b)))
    }

    // Once tied, the box turns slowly, picking up speed gently.
    if (turn.current && !still)
      turn.current.rotation.y += Math.min(delta, 0.05) * 0.3 * range(t, END, END + 1.5)

    // Dolly in from the open net to the closed box.
    const camera = state.camera as THREE.PerspectiveCamera
    const aspect = state.size.width / state.size.height
    const close = smooth(range(t, 1.2, 3.2))
    const radius = THREE.MathUtils.lerp(netRadius, boxRadius, close)
    const height = THREE.MathUtils.lerp(H * 1.6, H + 0.6, close)
    const distance = fitDistance(camera, aspect, radius, height) * 1.12 + radius * 0.4
    const elevation = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(42, 26, close))
    const targetY = THREE.MathUtils.lerp(0.1, H * 0.5, close)
    camera.position.set(0, targetY + Math.sin(elevation) * distance, Math.cos(elevation) * distance)
    camera.lookAt(look.set(0, targetY, 0))
  })

  return (
    <group ref={turn} rotation-y={-0.5}>
      <group position-y={-T / 2}>
        <Board size={[W, T, W]} />
      </group>
      <group ref={cake}>
        <Cake config={config} light lit={false} />
      </group>
      {SIDES.map((angle, i) => (
        <group key={angle} rotation-y={angle}>
          <group ref={(node) => void (folds.current[i] = node)} position-z={W / 2} rotation-x={OPEN}>
            <group position={[0, H / 2, -T / 2]}>
              <Board size={[i % 2 === 0 ? W : W - 2 * T, H, T]} />
            </group>
            {i === 2 && (
              <group ref={lid} position-y={H} rotation-x={OPEN}>
                <group position={[0, T / 2, -W / 2]}>
                  <Board size={[W, T, W]} />
                  {/* Turned back to face the front, so the name reads from the camera. */}
                  <group rotation-y={Math.PI} position-y={T / 2 + 0.002}>
                    <Suspense fallback={null}>
                      <Text
                        font="/fonts/Pacifico-Subset.woff"
                        fontSize={W * 0.075}
                        rotation-x={-Math.PI / 2}
                        position={[(-W / 2 + rx) / 2, 0, (W / 2 + rz) / 2]}
                        anchorX="center"
                        anchorY="middle"
                        color={INK}
                      >
                        Crumb & Cloud
                      </Text>
                    </Suspense>
                  </group>
                </group>
              </group>
            )}
          </group>
        </group>
      ))}
      <group ref={lidBands} position-y={H + T + 0.004} visible={false}>
        <mesh position-z={rz}>
          <boxGeometry args={[W + 0.012, 0.006, 0.14]} />
          <meshPhysicalMaterial color={RIBBON} roughness={0.35} sheen={1} sheenColor="#ffd1e2" />
        </mesh>
        <mesh position-x={rx}>
          <boxGeometry args={[0.14, 0.006, W + 0.012]} />
          <meshPhysicalMaterial color={RIBBON} roughness={0.35} sheen={1} sheenColor="#ffd1e2" />
        </mesh>
      </group>
      {SIDES.map((angle, i) => (
        <SideBand
          key={angle}
          width={W}
          height={H}
          angle={angle}
          offset={bandOffsets[i]}
          bandRef={(node) => void (sideBands.current[i] = node)}
        />
      ))}
      <group position={[rx, 0, rz]}>
        <Bow y={H + T + 0.007} bowRef={(node) => void (bow.current = node)} />
      </group>
    </group>
  )
}

export default function BoxScene({ config, children }: { config: CakeConfig; children?: ReactNode }) {
  return (
    <CanvasShell
      className="h-full w-full"
      mode="always"
      label="Your cake is lowered into a white Crumb & Cloud box. The sides fold up, the lid closes and a pink ribbon ties it."
      camera={{ position: [0, 3, 7], fov: 32, near: 0.1, far: 60 }}
    >
      <Studio floor={-T} shadows={false} />
      <ShadowBlob radius={boxSize(config).width * 1.05} y={-T} />
      <FoldingBox config={config} />
      {children}
      <Effects />
    </CanvasShell>
  )
}
