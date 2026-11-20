import { configKey, sizeOf, type CakeConfig } from './cake'
import { presetById } from './presets'

/**
 * How far ahead a cake must be ordered (PLAN.md section 6). Holidays are handled with the order date in
 * `order.ts`; this file only knows the cake.
 * - a house cake from the menu, 10–20 cm: 4 hours
 * - a cake designed on the site (any change from a house cake counts): 24 hours
 * - two tiers: 48 hours
 */
export type LeadKind = 'menu' | 'custom' | 'tiered'

export const LEAD_HOURS: Record<LeadKind, number> = { menu: 4, custom: 24, tiered: 48 }

/** Same-day menu cakes must be ordered before this hour (shop time). */
export const SAME_DAY_CUTOFF = '18:00'

export function leadKind(config: CakeConfig, presetId?: string): LeadKind {
  if (sizeOf(config).band === 'tiered') return 'tiered'
  const preset = presetById(presetId)
  if (preset && configKey(preset.config) === configKey(config)) return 'menu'
  return 'custom'
}

export const leadHours = (config: CakeConfig, presetId?: string) => LEAD_HOURS[leadKind(config, presetId)]
