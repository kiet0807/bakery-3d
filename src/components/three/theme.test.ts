import { describe, expect, it } from 'vitest'
import { PALETTES, PALETTE_IDS } from '@/lib/palettes'
import { sceneFor, type Scene } from './theme'

/** Every colour value of a scene, with its path, e.g. ["box.ribbon", "#f08aa3"]. */
function colours(scene: Scene): [string, string][] {
  return Object.entries(scene).flatMap(([key, value]) =>
    typeof value === 'string'
      ? [[key, value] as [string, string]]
      : Object.entries(value).map(([inner, v]) => [`${key}.${inner}`, v] as [string, string]),
  )
}

describe.each(PALETTE_IDS)('3D scene for palette %s', (id) => {
  const scene = sceneFor(id)
  const palette = PALETTES[id]

  it('melts into the page: fog, sky and photo backdrop are the set’s cream', () => {
    expect(scene.page).toBe(palette.cream)
    expect(scene.sky.bottom).toBe(palette.cream)
    expect(scene.photo.skyBottom).toBe(palette.cream)
    expect(scene.sky.top).toBe(palette['sky-top'])
    expect(scene.photo.skyTop).toBe(palette['sky-top'])
  })

  it('prints the box in the set’s ink and "Kai\'s" in its brand colour', () => {
    expect(scene.ink).toBe(palette.ink)
    expect(scene.box.print).toBe(palette.ink)
    expect(scene.box.printAccent).toBe(palette.brand)
  })

  it('uses only six-digit hex colours', () => {
    for (const [path, value] of colours(scene)) expect(value, path).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('returns the same object every time (safe in hook dependencies)', () => {
    expect(sceneFor(id)).toBe(scene)
  })
})

describe('palette B', () => {
  it('is the base the other sets were tuned from: nothing overridden', () => {
    const b = sceneFor('b')
    expect(b.box.ribbon).toBe('#ef7a4f')
    expect(b.table.rim).toBe('#8ed9c2')
    expect(b.light.fill).toBe('#c9f0e2')
  })
})

describe('the sets differ where they should', () => {
  it('gives each set its own ribbon and table rim', () => {
    const ribbons = new Set(PALETTE_IDS.map((id) => sceneFor(id).box.ribbon))
    const rims = new Set(PALETTE_IDS.map((id) => sceneFor(id).table.rim))
    expect(ribbons.size).toBe(PALETTE_IDS.length)
    expect(rims.size).toBe(PALETTE_IDS.length)
  })
})
