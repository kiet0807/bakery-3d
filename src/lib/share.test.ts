import { describe, expect, it } from 'vitest'
import { DEFAULT_CAKE, normalizeConfig } from './cake'
import { PRESETS } from './presets'
import { SHARE_PARAM, decodeCake, designPath, encodeCake } from './share'

describe('share links', () => {
  it('round-trips every house cake and a Vietnamese message', () => {
    for (const preset of PRESETS) expect(decodeCake(encodeCake(preset.config))).toEqual(preset.config)
    const cake = normalizeConfig({ ...DEFAULT_CAKE, toppings: [], message: 'Chúc mừng sinh nhật mẹ' })
    expect(decodeCake(encodeCake(cake))).toEqual(cake)
  })

  it('makes a URL-safe token of reasonable length', () => {
    const token = encodeCake(PRESETS[5].config)
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(token.length).toBeLessThan(200)
    expect(designPath(PRESETS[0].config)).toBe(`/design#${SHARE_PARAM}=${encodeCake(PRESETS[0].config)}`)
  })

  it('rejects broken tokens and cleans tampered ones', () => {
    expect(decodeCake(null)).toBeNull()
    expect(decodeCake('not base64 at all!')).toBeNull()
    expect(decodeCake(btoa('{"a":1}'))).toBeNull()
    expect(decodeCake('x'.repeat(2000))).toBeNull()
    const tampered = btoa(
      JSON.stringify(['huge', 'vanilla', 'x', 'y', 'z', 'unicorns', 'max', 99, '<b>hi</b>']),
    )
    expect(decodeCake(tampered)).toMatchObject({ size: DEFAULT_CAKE.size, candles: 9, message: 'bhib' })
  })
})
