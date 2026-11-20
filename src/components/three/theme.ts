import { PALETTES, PALETTE_IDS, type PaletteId } from '@/lib/palettes'
import { usePalette } from '@/lib/usePalette'

/**
 * Every colour of the 3D world around the cake, for each of the shop's palettes (`src/lib/palettes.ts`), lit like
 * a bright morning in the shop. Cake and topping colours belong to the customer's choices (`src/lib/cake.ts`) and
 * to `palette.ts`; they stay the same in every set.
 *
 * The canvases are transparent, so the page's cream and its blobs are the sky of every live scene. Pictures that
 * leave the page (saved images, the studio photo) paint the same sky themselves.
 *
 * `BASE` is palette B "Bơ Bạc Hà", the first set, tuned by eye. Each other set changes only what differs; the
 * colours that must match the page (cream, sky, ink, the "Kai's" brand colour) come from `PALETTES` itself, so the
 * two cannot drift apart. Components read the set in use with `useScene()`.
 */
const BASE = {
  /** The page behind the canvas: fog fades the far side of the vitrine into it. The set's cream. */
  page: '#fff8e5',
  sky: {
    top: '#d3f1e6',
    bottom: '#fff8e5',
    /** Centre of the radial sky behind saved pictures, a little lighter than the cream. */
    glow: '#fffcf2',
  },
  light: {
    /**
     * Hemisphere: warm white from above, a butter-cream bounce from below. A mint bounce turned cloud undersides
     * grey-green on the light tier; the mint now comes from the fill light and the sheen on the clouds.
     */
    sky: '#fff5e4',
    ground: '#f2eedb',
    /** The sun: warm morning light from the front right. */
    key: '#fff0dc',
    /** The set's green fill from behind left, where the old moonlight was. */
    fill: '#c9f0e2',
    /** A soft warm bounce low in front, like light off a tabletop. */
    bounce: '#ffcfb3',
    /** Environment panels for reflections on glaze, glass and porcelain. */
    panelWarm: '#ffe9cf',
    panelMint: '#d6f5ea',
    /** A cream floor under everything, bouncing light up into undersides. */
    panelFloor: '#fff3dc',
  },
  /** Ink of the brand, used for shadows (thinned) and for print on the box. */
  ink: '#1f3d36',
  /** Ambient occlusion tint: a warm cocoa brown, so creases look like shade on cream rather than soot. */
  occlusion: '#4a3a2e',
  porcelain: '#fffaf1',
  table: {
    top: '#fffaf1',
    rim: '#8ed9c2',
    /** The mark on the floor under the chosen cake: soft at rest, a bright accent when chosen. */
    markRest: '#c9ecdf',
    markChosen: '#ef7a4f',
  },
  glass: {
    body: '#f1fff9',
    knob: '#ffffff',
  },
  cloud: {
    near: '#ffffff',
    far: '#f7fcf8',
    /** The warm cloud on the right of the story scene. */
    peach: '#fff3ea',
    /** Sheen on the puffs: a cool rim against the warm light. */
    sheen: '#d3f1e6',
    /** A little light of their own keeps the undersides white instead of grey. */
    glow: '#fff8f0',
  },
  sprinkleGlow: '#ffffff',
  box: {
    board: '#fffdf8',
    ribbon: '#ef7a4f',
    ribbonSheen: '#ffd3bd',
    print: '#1f3d36',
    /** "Kai's" on the lid, in the set's brand colour (the header's wordmark). */
    printAccent: '#c24620',
    /** The shop's sticker on the lid, the same drawing as the logo: cake body, frosting, cherry. */
    stickerBody: '#ffd3bd',
    stickerMint: '#8ed9c2',
    stickerCherry: '#f2789f',
  },
  photo: {
    /** The studio floor of the path-traced photo: a cream a shade deeper than the sky it fades into. */
    floor: '#fff1dc',
    skyTop: '#d3f1e6',
    skyBottom: '#fff8e5',
  },
}

export type Scene = typeof BASE
type Override = { [K in keyof Scene]?: Scene[K] extends string ? string : Partial<Scene[K]> }

/** What each set changes besides the colours taken from `PALETTES`. */
const OVERRIDES: Record<PaletteId, Override> = {
  /** Matcha milk and strawberry: matcha fill and rim, a strawberry ribbon and mark, strawberry-milk bounce. */
  g1: {
    sky: { glow: '#fcfcf6' },
    light: {
      sky: '#fff8ec',
      ground: '#eef0dc',
      key: '#fff2e2',
      fill: '#d8ecc8',
      bounce: '#ffd3da',
      panelWarm: '#ffeedd',
      panelMint: '#e0f0d2',
      panelFloor: '#f8f6e6',
    },
    table: { top: '#fcfcf5', rim: '#a8cf8e', markRest: '#d6e9c4', markChosen: '#e0607e' },
    glass: { body: '#f6fdf0' },
    cloud: { far: '#f8fbf3', peach: '#fff1f3', sheen: '#e3f0d6', glow: '#fbfcf4' },
    box: { ribbon: '#f08aa3', ribbonSheen: '#ffd6e0', stickerBody: '#ffd6e0' },
    photo: { floor: '#f8f7ea' },
  },
  b: {},
  /** Pandan and coconut: the freshest green, a pandan ribbon and mark, a coconut-cream bounce. */
  g2: {
    sky: { glow: '#fafdf5' },
    light: {
      sky: '#fdfbec',
      ground: '#ecf3dc',
      key: '#fff3e0',
      fill: '#cdeec4',
      bounce: '#ffe2c6',
      panelWarm: '#fff0d8',
      panelMint: '#d8f3cf',
      panelFloor: '#f6f8e6',
    },
    table: { top: '#fbfdf6', rim: '#8fd99a', markRest: '#d4ecc9', markChosen: '#3f9a52' },
    glass: { body: '#f4fdf0' },
    cloud: { far: '#f6fbf1', peach: '#fff6e8', sheen: '#dcf2d4', glow: '#fbfdf3' },
    box: { ribbon: '#2f8a45', ribbonSheen: '#a6dcae', stickerBody: '#fff1c9' },
    photo: { floor: '#f6f9ec' },
  },
  /** Forest and cream: a deep forest ribbon, sage fill, the peach-orange mark kept from B. */
  g3: {
    sky: { glow: '#fefcf5' },
    light: {
      sky: '#fff6e6',
      ground: '#f1eedc',
      fill: '#d3e7d6',
      bounce: '#ffd2b8',
      panelWarm: '#ffeacf',
      panelMint: '#dbecdc',
      panelFloor: '#fbf3e0',
    },
    table: { rim: '#9cc8a8', markRest: '#d5e6d6', markChosen: '#ef7a4f' },
    glass: { body: '#f5fbf6' },
    cloud: { far: '#f8faf6', sheen: '#e1ece2', glow: '#fff9f1' },
    box: { ribbon: '#1f5c3d', ribbonSheen: '#7fae8f', stickerBody: '#fbe3d6' },
    photo: { floor: '#fbf0dc' },
  },
}

function build(id: PaletteId): Scene {
  const p = PALETTES[id]
  const o = OVERRIDES[id]
  return {
    ...BASE,
    page: p.cream,
    sky: { ...BASE.sky, top: p['sky-top'], bottom: p.cream, ...o.sky },
    light: { ...BASE.light, ...o.light },
    ink: p.ink,
    table: { ...BASE.table, ...o.table },
    glass: { ...BASE.glass, ...o.glass },
    cloud: { ...BASE.cloud, ...o.cloud },
    box: {
      ...BASE.box,
      print: p.ink,
      printAccent: p.brand,
      stickerMint: p.mint,
      stickerCherry: p.berry,
      ...o.box,
    },
    photo: { ...BASE.photo, skyTop: p['sky-top'], skyBottom: p.cream, ...o.photo },
  }
}

/** Built once: the same object per set, so it is safe in hook dependencies. */
const SCENES = Object.fromEntries(PALETTE_IDS.map((id) => [id, build(id)])) as Record<PaletteId, Scene>

/** The 3D colours of a palette. */
export const sceneFor = (id: PaletteId): Scene => SCENES[id]

/**
 * The 3D colours of the palette in use. Switching sets re-renders the scene with new material colours: no new
 * canvas, no shader compile.
 */
export const useScene = (): Scene => sceneFor(usePalette())

/** Candles are part of the cake, not the shop's colours: the same in every set. */
export const CANDLE = {
  wick: '#2b211c',
  flame: '#ffc861',
}
