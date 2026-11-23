'use client'

import { ContactShadows, Environment, Lightformer, useEnvironment } from '@react-three/drei'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import {
  Component,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import * as THREE from 'three'
import { useQuality, useReducedMotionScene } from './motion'
import { useScene, type Scene } from './theme'
import { Timeline, useSettler } from './tween'

/** "Comfy Café" by Sergej Majboroda, Poly Haven (CC0): the light of every high-tier scene and of photos. */
export const CAFE_HDRI = '/hdri/comfy_cafe_1k.hdr'

/**
 * How much of the horizon covers what is behind it, where the camera stays above the cake: enough to lift the black
 * out of a low view, little enough that a red glaze keeps its depth and a box its shaded sides.
 */
const HORIZON_STRENGTH = 0.25
/** The hemisphere's intensity without a horizon, per tier, and how much of it a full horizon replaces. */
const HEMISPHERE = { high: 1.05, low: 1.35 }
const HORIZON_SHARE = 0.26
/** The horizon's height, in degrees above eye level: full strength between the inner pair, none outside the outer. */
const HORIZON = { from: -38, full: -8, until: 24, to: 58 }

/** A dome around the scene whose vertices carry how much of the horizon shows there, as alpha. */
function horizonGeometry() {
  const dome = new THREE.SphereGeometry(30, 24, 48)
  const position = dome.getAttribute('position')
  const colors = new Float32Array(position.count * 4).fill(1)
  for (let i = 0; i < position.count; i++) {
    const height = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(position.getY(i) / 30, -1, 1)))
    colors[i * 4 + 3] =
      THREE.MathUtils.smoothstep(height, HORIZON.from, HORIZON.full) *
      (1 - THREE.MathUtils.smoothstep(height, HORIZON.until, HORIZON.to))
  }
  dome.setAttribute('color', new THREE.BufferAttribute(colors, 4))
  return dome
}

/**
 * The bright page around the cake, for reflections. Glaze and porcelain mirror whatever lies behind them when seen
 * at a low angle, and that was the black of an empty cube (light tier) or the café's dark walls (high tier): the top
 * of a white-chocolate cake turned grey-brown and every drip wore a dark outline, on a page that is cream all round.
 */
function Horizon({ color, strength }: { color: string; strength: number }) {
  const geometry = useMemo(() => horizonGeometry(), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color={color}
        vertexColors
        transparent
        opacity={strength}
        side={THREE.BackSide}
        depthWrite={false}
        toneMapped={false}
        fog={false}
      />
    </mesh>
  )
}

/**
 * Soft panels around the cake: shaped highlights on glaze and porcelain. Rendered once, no download. A new
 * palette gives new children, and drei's Environment renders its cube again (once) when its children change.
 */
function Panels({ light, horizon }: { light: Scene['light']; horizon: number }) {
  return (
    <>
      <Horizon color={light.panelFloor} strength={horizon} />
      <Lightformer
        form="rect"
        intensity={1.6}
        position={[0, 5, 1]}
        rotation-x={Math.PI / 2}
        scale={[8, 4, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.2}
        color={light.panelWarm}
        position={[-5, 1.5, 2]}
        rotation-y={Math.PI / 2}
        scale={[4, 3, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.1}
        color={light.panelMint}
        position={[5, 1, -1]}
        rotation-y={-Math.PI / 2}
        scale={[3, 4, 1]}
      />
      {/* Warm light bounced up from a cream floor: keeps cloud undersides cream instead of grey-green. */}
      <Lightformer
        form="rect"
        intensity={0.55}
        color={light.panelFloor}
        position={[0, -4, 0]}
        rotation-x={-Math.PI / 2}
        scale={[10, 10, 1]}
      />
    </>
  )
}

/** How strongly each light shows in reflections: the panels alone, and the café with the same panels. */
const PANELS_INTENSITY = 0.85
const CAFE_INTENSITY = 0.7
/** Size of each face of the environment cube. */
const ENV_RESOLUTION = 256
/** How long the café light takes to come in when its download lands after the scene is on screen. */
const LIGHT_FADE_MS = 600

const smooth = (t: number) => t * t * (3 - 2 * t)

/** The cube the café light is drawn into, and how far its fade has come. It lives outside React's state. */
class CafeCube {
  readonly virtual = new THREE.Scene()
  readonly target = new THREE.WebGLCubeRenderTarget(ENV_RESOLUTION)
  readonly fade = new Timeline()
  /** How far the café light has come in, eased, 0 to 1. */
  mix = 0
  private camera: THREE.CubeCamera | null = null

  constructor() {
    this.target.texture.type = THREE.HalfFloatType
  }

  attach(camera: THREE.CubeCamera | null) {
    this.camera = camera
  }

  /** Makes this cube the scene's light, at the strength the fade has reached. */
  claim(scene: THREE.Scene) {
    scene.environment = this.target.texture
    scene.environmentIntensity = THREE.MathUtils.lerp(PANELS_INTENSITY, CAFE_INTENSITY, this.mix)
  }

  /** Remembers the scene's light (the panels'), to give it back when the café light goes. */
  takeOver(scene: THREE.Scene) {
    const environment = scene.environment
    const intensity = scene.environmentIntensity
    return () => {
      scene.environment = environment
      scene.environmentIntensity = intensity
      this.target.dispose()
    }
  }

  /** Draws the cube with the café at this strength (0 to 1) behind the panels. */
  draw(gl: THREE.WebGLRenderer, scene: THREE.Scene, cafe: THREE.Texture, value: number) {
    this.mix = value
    this.virtual.background = cafe
    this.virtual.environment = cafe
    this.virtual.backgroundIntensity = value
    this.claim(scene)
    if (!this.camera) return
    const autoClear = gl.autoClear
    gl.autoClear = true
    this.camera.update(gl, this.virtual)
    gl.autoClear = autoClear
  }
}

/**
 * The café HDRI (1.6 MB) usually lands after the scene is on screen, lit by the panels alone. drei's Environment
 * would swap one light for the other in a single frame, a visible jump in brightness and warmth. This draws the
 * same cube drei would (the café as background, the same panels in front of it) but brings the café in over
 * LIGHT_FADE_MS: its strength in the cube goes from 0 to 1 while the scene's environment intensity goes from the
 * panels' to the café's, so the first frame is exactly the panel light and the last exactly the café light. Each
 * frame of the fade draws the cube again (and three refilters it). With reduced motion the café light is simply
 * there; a saved picture or studio photo (the settler) jumps to the end.
 */
function CafeLight({ light, horizon }: { light: Scene['light']; horizon: number }) {
  const cafe = useEnvironment({ files: CAFE_HDRI })
  const get = useThree((state) => state.get)
  const still = useReducedMotionScene()
  const settler = useSettler()
  const [cube] = useState(() => new CafeCube())
  const release = useRef<() => void>(() => {})
  const draw = (value: number) => {
    const { gl, scene } = get()
    cube.draw(gl, scene, cafe, value)
  }

  // Holds the scene's light while mounted, and hands back the panels' when it goes.
  useLayoutEffect(() => {
    const restore = cube.takeOver(get().scene)
    return () => {
      restore()
      cafe.dispose()
    }
  }, [get, cube, cafe])

  // The download has landed: fade in, or be there at once.
  useLayoutEffect(() => {
    if (still) {
      draw(1)
      get().invalidate()
      return
    }
    cube.fade.play(LIGHT_FADE_MS)
    draw(0)
    const done = settler.add(() => {
      cube.fade.finish()
      draw(1)
    })
    release.current = done
    return done
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the download lands
  }, [])

  // A new colour set repaints the panels inside the cube.
  const drawnFor = useRef(light)
  useLayoutEffect(() => {
    if (drawnFor.current === light) return
    drawnFor.current = light
    draw(cube.mix)
    get().invalidate()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the panels change
  }, [light])

  // The panels' own Environment (rendered just before this) sets the scene's light again whenever its children
  // change: take it back after every commit. Two assignments, no drawing.
  useLayoutEffect(() => cube.claim(get().scene))

  useFrame(({ gl, scene, invalidate }) => {
    if (!cube.fade.active) return
    cube.draw(gl, scene, cafe, smooth(cube.fade.progress()))
    if (cube.fade.active) invalidate()
    else release.current()
  })

  return createPortal(
    <>
      <Panels light={light} horizon={horizon} />
      <cubeCamera ref={(camera) => cube.attach(camera)} args={[0.1, 1000, cube.target]} />
    </>,
    cube.virtual,
  )
}

/**
 * A café light that cannot load (offline, a failed download) leaves the panel light on. Without this the error
 * reached the scene's own boundary, which swapped the whole 3D scene for the 2D drawing.
 */
class CafeLightBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.warn('The café light did not load; the scene keeps the panel light.', error)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/**
 * Morning-in-the-shop lighting for every scene: warm sunlight on the cake from the front right, a mint fill
 * from behind, a peach bounce from below, and a hemisphere that keeps shadows a soft green instead of grey.
 * Reflections come from a real café interior (Poly Haven, CC0) on the high tier, or from soft panels.
 */
export function Studio({
  floor,
  shadowScale = 7,
  shadows = true,
  horizon = HORIZON_STRENGTH,
}: {
  floor: number
  shadowScale?: number
  shadows?: boolean
  /** How bright the page shows in reflections seen at a low angle, 0 to 1 (see `Horizon`). */
  horizon?: number
}) {
  const quality = useQuality()
  const high = quality === 'high'
  const { light, ink } = useScene()
  // The same element while the colours stay: drei's Environment draws its cube again (and resets the scene's
  // light) whenever its children change, which a new element on every render of the scene would cause.
  const panels = useMemo(() => <Panels light={light} horizon={horizon} />, [light, horizon])
  return (
    <>
      {/* Colours as props, not args: a palette change recolours the light instead of replacing it. */}
      <hemisphereLight
        color={light.sky}
        groundColor={light.ground}
        intensity={(high ? HEMISPHERE.high : HEMISPHERE.low) * (1 - HORIZON_SHARE * horizon)}
      />
      <directionalLight
        position={[3, 5.5, 4.5]}
        intensity={high ? 2.5 : 2.3}
        color={light.key}
        castShadow={high}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-near={1}
        shadow-camera-far={16}
      />
      <directionalLight position={[-4, 3, -4]} intensity={high ? 1.3 : 1.1} color={light.fill} />
      <pointLight position={[-2.5, -0.5, 2.5]} intensity={2.2} distance={8} color={light.bounce} />
      <Environment resolution={ENV_RESOLUTION} frames={1} environmentIntensity={PANELS_INTENSITY}>
        {panels}
      </Environment>
      {high && (
        <CafeLightBoundary>
          <Suspense fallback={null}>
            <CafeLight light={light} horizon={horizon} />
          </Suspense>
        </CafeLightBoundary>
      )}
      {shadows && (
        <ContactShadows
          position={[0, floor + 0.002, 0]}
          opacity={0.35}
          scale={shadowScale}
          blur={2.4}
          far={1.6}
          resolution={512}
          color={ink}
        />
      )}
    </>
  )
}
