import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DEFAULT_PALETTE, PALETTES, PALETTE_IDS, UI_TOKENS, paletteCss, type UiToken } from './palettes'

const channel = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16) / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
/** WCAG 2.2 contrast ratio. */
export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// [text, background, minimum]: 4.5 for text, 3 for control edges and large display text.
const PAIRS: [UiToken, UiToken, number][] = [
  ['ink', 'cream', 4.5],
  ['ink', 'surface', 4.5],
  ['ink', 'soft', 4.5],
  ['ink', 'butter', 4.5],
  ['ink', 'butter-soft', 4.5],
  ['ink', 'peach-soft', 4.5],
  ['ink', 'mint', 4.5],
  ['muted', 'cream', 4.5],
  ['muted', 'surface', 4.5],
  ['muted', 'soft', 4.5],
  ['muted', 'butter-soft', 4.5],
  ['muted', 'cream-deep', 4.5],
  ['muted', 'peach-soft', 4.5],
  ['leaf', 'cream', 4.5],
  ['leaf', 'surface', 4.5],
  ['leaf', 'soft', 4.5],
  ['leaf', 'butter-soft', 4.5],
  ['buy', 'cream', 4.5],
  ['buy', 'surface', 4.5],
  ['error', 'cream', 4.5],
  ['error', 'surface', 4.5],
  ['error', 'soft', 4.5],
  ['edge', 'cream', 3],
  ['edge', 'surface', 3],
  // The address box of the checkout is `soft`, with fields on it.
  ['edge', 'soft', 3],
  // "Kai's" in script is large display text.
  ['brand', 'cream', 3],
  ['brand', 'surface', 3],
]

describe.each(PALETTE_IDS)('palette %s', (id) => {
  const palette = PALETTES[id]

  it.each(PAIRS)('%s on %s reaches %s:1', (text, background, minimum) => {
    expect(contrast(palette[text], palette[background])).toBeGreaterThanOrEqual(minimum)
  })

  it('keeps white text readable on the buy button', () => {
    expect(contrast('#ffffff', palette.buy)).toBeGreaterThanOrEqual(4.5)
    expect(contrast('#ffffff', palette['buy-deep'])).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps the "Kai\'s" sticker shadow apart from the letters', () => {
    expect(contrast(palette.brand, palette['brand-shadow'])).toBeGreaterThanOrEqual(2)
  })

  it('has every token as a six-digit hex colour', () => {
    for (const token of UI_TOKENS) expect(palette[token]).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe('globals.css', () => {
  const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')
  const theme = css.slice(css.indexOf('@theme {'), css.indexOf('}', css.indexOf('@theme {')))

  it('declares the default palette in @theme, token for token', () => {
    for (const token of UI_TOKENS) {
      const match = theme.match(new RegExp(`--color-${token}:\\s*(#[0-9a-fA-F]{6});`))
      expect(match?.[1].toLowerCase(), token).toBe(PALETTES[DEFAULT_PALETTE][token])
    }
  })

  it('has no other colour tokens than the palettes know', () => {
    const declared = [...theme.matchAll(/--color-([a-z-]+):/g)].map((m) => m[1])
    expect(declared.sort()).toEqual([...UI_TOKENS].sort())
  })
})

describe('paletteCss', () => {
  const css = paletteCss()

  it('writes one rule per palette with every token and the sprinkles', () => {
    for (const id of PALETTE_IDS) {
      const rule = css.match(new RegExp(`:root\\[data-palette="${id}"\\]\\{([^}]*)\\}`))?.[1]
      expect(rule, id).toBeDefined()
      for (const token of UI_TOKENS) expect(rule).toContain(`--color-${token}:${PALETTES[id][token]}`)
      expect(rule).toContain('--sprinkles:url("data:image/svg+xml,')
    }
  })

  it('cannot close the style element early', () => {
    expect(css).not.toMatch(/<\/?style/i)
  })
})
