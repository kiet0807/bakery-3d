import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PRESETS, presetPicture } from './presets'

describe('pictures of the house cakes', () => {
  const script = readFileSync('scripts/preset-shots.mjs', 'utf8')

  it.each(PRESETS.map((preset) => preset.id))('%s has its picture, and the script retakes it', (id) => {
    expect(existsSync(`public${presetPicture(id)}`)).toBe(true)
    expect(script).toContain(`'${id}'`)
  })
})
