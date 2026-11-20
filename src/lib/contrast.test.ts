import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** Reads the colour tokens straight from globals.css, so a palette change is re-measured here. */
const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')
const token = (name: string) => {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!match) throw new Error(`No --color-${name} in globals.css`)
  return match[1]
}

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
const PAIRS: [string, string, number][] = [
  ['ink', 'cream', 4.5],
  ['ink', 'surface', 4.5],
  ['ink', 'soft', 4.5],
  ['ink', 'butter', 4.5],
  ['ink', 'butter-soft', 4.5],
  ['ink', 'peach-soft', 4.5],
  ['muted', 'cream', 4.5],
  ['muted', 'surface', 4.5],
  ['muted', 'soft', 4.5],
  ['muted', 'butter-soft', 4.5],
  ['muted', 'cream-deep', 4.5],
  ['leaf', 'cream', 4.5],
  ['leaf', 'surface', 4.5],
  ['leaf', 'soft', 4.5],
  ['buy', 'cream', 4.5],
  ['buy', 'surface', 4.5],
  ['error', 'cream', 4.5],
  ['error', 'surface', 4.5],
  ['edge', 'cream', 3],
  ['edge', 'surface', 3],
]

describe('palette contrast', () => {
  it.each(PAIRS)('%s on %s reaches %s:1', (text, background, minimum) => {
    expect(contrast(token(text), token(background))).toBeGreaterThanOrEqual(minimum)
  })

  it('keeps white text readable on the buy button', () => {
    expect(contrast('#ffffff', token('buy'))).toBeGreaterThanOrEqual(4.5)
    expect(contrast('#ffffff', token('buy-deep'))).toBeGreaterThanOrEqual(4.5)
  })
})
