/**
 * Every colour of the 3D scenes, in one place: palette B "Bơ Bạc Hà" (butter and mint) from globals.css,
 * lit like a bright morning in the shop. Cake and topping colours belong to the customer's choices
 * (`src/lib/cake.ts`) and to `palette.ts`; this file is the world around the cake.
 *
 * The canvases are transparent, so the page's cream and its mint and peach blobs are the sky of every live
 * scene. Pictures that leave the page (saved images, the studio photo) paint the same sky themselves.
 */
export const SCENE = {
  /** The page behind the canvas: fog fades the far side of the vitrine into it. */
  page: '#fff8e5',
  sky: {
    top: '#d3f1e6',
    bottom: '#fff8e5',
    /** Centre of the radial sky behind saved pictures. */
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
    /** Mint fill from behind left, where the old moonlight was. */
    fill: '#c9f0e2',
    /** A soft peach bounce low in front, like light off a warm tabletop. */
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
  /** Contact shadow colour as RGB, painted with alpha in ShadowBlob. */
  shadowRgb: '31, 61, 54',
  porcelain: '#fffaf1',
  table: {
    top: '#fffaf1',
    rim: '#8ed9c2',
    /** The mark on the floor under the chosen cake: soft mint at rest, the buying peach when chosen. */
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
    peach: '#fff3ea',
    /** Sheen on the puffs: mint, so the cloud edges catch a cool rim against the warm light. */
    sheen: '#d3f1e6',
    /** A little light of their own keeps the undersides white-mint instead of grey. */
    glow: '#fff8f0',
  },
  sprinkleGlow: '#ffffff',
  box: {
    board: '#fffdf8',
    ribbon: '#ef7a4f',
    ribbonSheen: '#ffd3bd',
    print: '#1f3d36',
    /** "Kai's" on the lid, in the buying red of the header's wordmark. */
    printAccent: '#c24620',
    stickerMint: '#8ed9c2',
    stickerCherry: '#f2789f',
  },
  photo: {
    /** The studio floor of the path-traced photo: warm cream that fades into the sky. */
    floor: '#fff1dc',
    skyTop: '#d3f1e6',
    skyBottom: '#fff8e5',
  },
  candle: {
    wick: '#2b211c',
    flame: '#ffc861',
  },
} as const

/** "rgba(31, 61, 54, 0.4)" from the shadow colour. */
export const shadowRgba = (alpha: number) => `rgba(${SCENE.shadowRgb}, ${alpha})`
