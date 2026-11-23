'use client'

import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef, type ReactNode, type RefObject } from 'react'
import * as THREE from 'three'
import { useDict } from '@/i18n/LangProvider'
import { sizeOf, type CakeConfig } from '@/lib/cake'
import { FROSTING } from '../cake/geometry'
import { Cake } from '../cake/Cake'
import { headroom } from '../cake/layout'
import { CanvasShell } from '../CanvasShell'
import { Effects } from '../Effects'
import { IdlePace } from '../IdlePace'
import { useReducedMotionScene } from '../motion'
import { ShadowBlob } from '../ShadowBlob'
import { Studio } from '../Studio'
import { useScene } from '../theme'

/** Board thickness. */
const T = 0.025
/** Seconds from the start until everything has landed; the box then only turns. */
const END = 3.9
const OPEN = Math.PI / 2
const SIDES = [0, Math.PI / 2, Math.PI, -Math.PI / 2]
/** The ribbon is tied off-centre, towards the back right, leaving the front of the lid for the name. */
const RIBBON_X = 0.28
const RIBBON_Z = -0.22
/** Size of the shop's print on the lid: big enough to read at the camera's grazing angle. */
const PRINT = 1.35

/** When each side folds up (front, right, back, left), in seconds from the start. */
const FOLD_TIMES: [number, number][] = [
  [0.9, 1.5],
  [1.1, 1.7],
  [1.5, 2.1],
  [1.3, 1.9],
]

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
  return { width, height: cake + headroom(config) + 0.1 }
}

/** Camera distance at which a subject of this half-width and height fits the view. */
function fitDistance(camera: THREE.PerspectiveCamera, aspect: number, radius: number, height: number) {
  const vertical = THREE.MathUtils.degToRad(camera.fov)
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * aspect)
  return Math.max(height / 2 / Math.tan(vertical / 2), radius / Math.tan(horizontal / 2))
}

/**
 * The shop's little mark printed on the lid: a round sticker with a mint-frosted cake and a cherry, the same
 * drawing as the logo in the header, in flat shapes that cost a handful of triangles.
 */
function LidSticker({ size }: { size: number }) {
  const { box } = useScene()
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[size, 40]} />
        <meshStandardMaterial color={box.print} roughness={0.8} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.0006}>
        <circleGeometry args={[size * 0.86, 40]} />
        <meshStandardMaterial color={box.board} roughness={0.8} />
      </mesh>
      {/* Cake body, frosting and cherry, seen from above the lid as a flat print. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.0012, size * 0.18]}>
        <planeGeometry args={[size * 1.05, size * 0.5]} />
        <meshStandardMaterial color={box.stickerBody} roughness={0.8} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.0016, -size * 0.1]}>
        <planeGeometry args={[size * 1.05, size * 0.22]} />
        <meshStandardMaterial color={box.stickerMint} roughness={0.8} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, -size * 0.42]}>
        <circleGeometry args={[size * 0.17, 24]} />
        <meshStandardMaterial color={box.stickerCherry} roughness={0.6} />
      </mesh>
    </group>
  )
}

function Board({ size }: { size: [number, number, number] }) {
  const { box } = useScene()
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={box.board} roughness={0.78} />
    </mesh>
  )
}

/** Satin ribbon in the set's colour. */
function RibbonMaterial() {
  const { box } = useScene()
  return <meshPhysicalMaterial color={box.ribbon} roughness={0.35} sheen={1} sheenColor={box.ribbonSheen} />
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
          <RibbonMaterial />
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
          <RibbonMaterial />
        </mesh>
      ))}
      <mesh position-y={0.045} castShadow>
        <sphereGeometry args={[0.065, 20, 16]} />
        <RibbonMaterial />
      </mesh>
    </group>
  )
}

/**
 * The closing scene: the cake lowers onto the board, the four sides fold up, the lid closes, and a ribbon
 * ties it all up. Driven by the time since the scene appeared; with reduced motion it starts at the end.
 * `startedAt` lives outside the canvas: when a slow device drops to the light tier the canvas is rebuilt, and
 * the box must carry on where it was instead of unpacking itself and folding up again.
 */
function FoldingBox({ config, startedAt }: { config: CakeConfig; startedAt: RefObject<number | null> }) {
  const { scenes } = useDict()
  const { box } = useScene()
  const still = useReducedMotionScene()
  const { width: W, height: H } = useMemo(() => boxSize(config), [config])
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
    const now = performance.now() / 1000
    startedAt.current ??= now
    const t = still ? END : now - startedAt.current
    if (t < END) state.invalidate()

    if (cake.current) cake.current.position.y = (1 - settle(range(t, 0, 0.9))) * (H + 0.5)
    folds.current.forEach((pivot, i) => {
      if (pivot) pivot.rotation.x = OPEN * (1 - smooth(range(t, ...FOLD_TIMES[i])))
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
                    {/* The free corner of the lid: front left of the ribbon's cross. */}
                    <group position={[(-W / 2 + rx) / 2, 0, (W / 2 + rz) / 2]} scale={PRINT}>
                      <group position={[-W * 0.17, 0, 0]}>
                        <LidSticker size={W * 0.075} />
                      </group>
                      <Suspense fallback={null}>
                        <Text
                          font="/fonts/Pacifico-Subset.woff"
                          fontSize={W * 0.08}
                          rotation-x={-Math.PI / 2}
                          position={[W * 0.05, 0, -W * 0.02]}
                          anchorX="center"
                          anchorY="middle"
                          color={box.printAccent}
                        >
                          {scenes.boxName}
                        </Text>
                        <Text
                          font="/fonts/Pacifico-Subset.woff"
                          fontSize={W * 0.042}
                          rotation-x={-Math.PI / 2}
                          position={[W * 0.06, 0, W * 0.065]}
                          anchorX="center"
                          anchorY="middle"
                          color={box.print}
                        >
                          {scenes.boxLine}
                        </Text>
                      </Suspense>
                    </group>
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
          <RibbonMaterial />
        </mesh>
        <mesh position-x={rx}>
          <boxGeometry args={[0.14, 0.006, W + 0.012]} />
          <RibbonMaterial />
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
  const { scenes, cart } = useDict()
  const startedAt = useRef<number | null>(null)
  return (
    <CanvasShell
      className="h-full w-full"
      mode="demand"
      label={scenes.box}
      poster={cart.done.boxLoading}
      camera={{ position: [0, 3, 7], fov: 32, near: 0.1, far: 60 }}
    >
      <Studio />
      <ShadowBlob radius={boxSize(config).width * 1.05} y={-T} />
      <FoldingBox config={config} startedAt={startedAt} />
      {/* The box on show turns at the idle pace; while it folds, FoldingBox asks for every frame itself. */}
      <IdlePace />
      {children}
      <Effects />
    </CanvasShell>
  )
}
