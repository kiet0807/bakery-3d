/**
 * The shop's colour sets. Visitors pick one with the switch in the header; the choice is kept in this browser.
 * This file is the single source: the page CSS (`paletteCss`, injected by the root layout), the switch's swatches
 * and the 3D scenes (`three/theme.ts`) all read it, and `contrast.test.ts` measures every set.
 *
 * - G1 "Matcha Dâu" (matcha milk and strawberry) is the default since 2026-11-20; `globals.css` holds the same
 *   values in `@theme` so Tailwind knows the tokens, and a test keeps the two equal.
 * - B "Bơ Bạc Hà" is the first palette the owner chose; G2 and G3 are the other green sets from the comparison
 *   page. All are Kai's own colours, not taken from any real shop.
 * - Roles are the same in every set: ink and muted carry text, leaf is links and focus, buy is only for buying,
 *   brand is the "Kai's" script (large text, 3:1), the rest is decoration.
 */
export const PALETTE_IDS = ['g1', 'b', 'g2', 'g3'] as const
export type PaletteId = (typeof PALETTE_IDS)[number]
export const DEFAULT_PALETTE: PaletteId = 'g1'

/** localStorage key of the visitor's choice. */
export const PALETTE_KEY = 'kais-bakery-palette'

export const isPaletteId = (value: unknown): value is PaletteId => PALETTE_IDS.includes(value as PaletteId)

export const UI_TOKENS = [
  'cream',
  'cream-deep',
  'surface',
  'soft',
  'butter',
  'butter-soft',
  'peach-soft',
  'ink',
  'muted',
  'line',
  'edge',
  'buy',
  'buy-deep',
  'leaf',
  'brand',
  'mint',
  'peach',
  'berry',
  'error',
  'sky-top',
  'sky-bottom',
] as const
export type UiToken = (typeof UI_TOKENS)[number]
export type Palette = Record<UiToken, string>

export const PALETTES: Record<PaletteId, Palette> = {
  /** Matcha milk and strawberry: soft matcha greens, a strawberry "Kai's", the buy button in deep matcha. */
  g1: {
    cream: '#f7f7ec',
    'cream-deep': '#ecefd9',
    surface: '#ffffff',
    soft: '#e3efd6',
    butter: '#f6d77a',
    'butter-soft': '#f6f1d2',
    'peach-soft': '#fbe3e6',
    ink: '#1d3424',
    muted: '#4b6151',
    line: '#dfe4cb',
    edge: '#77897b',
    buy: '#3f6f2a',
    'buy-deep': '#335b22',
    leaf: '#2c6b45',
    brand: '#d24a6a',
    mint: '#a8cf8e',
    peach: '#f7a8b8',
    berry: '#e0607e',
    error: '#b42318',
    'sky-top': '#dfeccc',
    'sky-bottom': '#f7f7ec',
  },
  /** Butter and mint, the first palette: cream, mint, a peach-orange buy button. */
  b: {
    cream: '#fff8e5',
    'cream-deep': '#fbefcf',
    surface: '#ffffff',
    soft: '#e2f5ee',
    butter: '#ffc94d',
    'butter-soft': '#fff0c2',
    'peach-soft': '#ffe4d4',
    ink: '#1f3d36',
    muted: '#4f665e',
    line: '#e8dfc2',
    edge: '#7a8c83',
    buy: '#c24620',
    'buy-deep': '#a53a17',
    leaf: '#1c7560',
    brand: '#c24620',
    mint: '#8ed9c2',
    peach: '#ffb38a',
    berry: '#f2789f',
    error: '#b42318',
    'sky-top': '#d3f1e6',
    'sky-bottom': '#fff8e5',
  },
  /** Pandan and coconut: the freshest green, coconut-butter chips, a pandan-green buy button. */
  g2: {
    cream: '#f4faec',
    'cream-deep': '#e6f2d6',
    surface: '#ffffff',
    soft: '#d8f1cc',
    butter: '#ffd95e',
    'butter-soft': '#fff4c9',
    'peach-soft': '#ffe6dc',
    ink: '#163a20',
    muted: '#45634c',
    line: '#d6e8cb',
    edge: '#71907a',
    buy: '#1f7a37',
    'buy-deep': '#18652d',
    leaf: '#1d6b45',
    brand: '#1f7a37',
    mint: '#8fd99a',
    peach: '#ffb38a',
    berry: '#f2789f',
    error: '#b42318',
    'sky-top': '#d1efc6',
    'sky-bottom': '#f4faec',
  },
  /** Forest and cream: deep forest ink and logo, warm cream, the peach-orange buy button kept from B. */
  g3: {
    cream: '#fbf7ec',
    'cream-deep': '#f3ead4',
    surface: '#ffffff',
    soft: '#e1ece2',
    butter: '#e8c35f',
    'butter-soft': '#f8edcb',
    'peach-soft': '#fbe3d6',
    ink: '#173d2b',
    muted: '#4a6255',
    line: '#e6dfca',
    edge: '#7a8a80',
    buy: '#b8481f',
    'buy-deep': '#9a3b18',
    leaf: '#21684a',
    brand: '#173d2b',
    mint: '#9cc8a8',
    peach: '#f2b48f',
    berry: '#e9879f',
    error: '#b42318',
    'sky-top': '#dbe9dc',
    'sky-bottom': '#fbf7ec',
  },
}

/**
 * One rule per palette, for the root layout's inline `<style>`: `:root[data-palette="b"] { --color-cream: … }`.
 * The attribute selector outranks Tailwind's `:root` theme block, so the chosen set wins.
 */
export function paletteCss(): string {
  return PALETTE_IDS.map((id) => {
    const vars = UI_TOKENS.map((token) => `--color-${token}:${PALETTES[id][token]}`).join(';')
    return `:root[data-palette="${id}"]{${vars}}`
  }).join('')
}

/**
 * Runs in <head> before the first paint: applies the saved palette so the page never flashes the default.
 * Plain ES5, no imports; anything unexpected in storage is ignored.
 */
export const PALETTE_SCRIPT = `(function(){try{var p=localStorage.getItem(${JSON.stringify(PALETTE_KEY)});if(${JSON.stringify(
  PALETTE_IDS,
)}.indexOf(p)>-1)document.documentElement.setAttribute("data-palette",p)}catch(e){}})()`
