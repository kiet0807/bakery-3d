import { describe, expect, it } from 'vitest'
import { DEFAULT_CAKE } from './cake'
import { leadHours, leadKind } from './leadTime'
import { PRESETS, presetById } from './presets'

describe('leadKind', () => {
  it('treats an unchanged house cake as a menu cake', () => {
    const preset = presetById('strawberry-cloud')!
    expect(leadKind(preset.config, preset.id)).toBe('menu')
    expect(leadHours(preset.config, preset.id)).toBe(4)
  })

  it('treats any change, or no preset at all, as a custom design', () => {
    const preset = presetById('strawberry-cloud')!
    expect(leadKind({ ...preset.config, message: 'Hi' }, preset.id)).toBe('custom')
    expect(leadKind(DEFAULT_CAKE)).toBe('custom')
    expect(leadHours(DEFAULT_CAKE)).toBe(24)
  })

  it('always needs two days for two tiers, even from the menu', () => {
    const crown = PRESETS.find((p) => p.config.size === 'tier2')!
    expect(leadKind(crown.config, crown.id)).toBe('tiered')
    expect(leadHours(crown.config, crown.id)).toBe(48)
  })
})
