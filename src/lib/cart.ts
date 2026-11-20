import { configKey, normalizeConfig, priceOf, type CakeConfig } from './cake'

export const MAX_QUANTITY = 20
/** Only the newest few lines keep their picture, so the saved cart stays small. */
export const MAX_SNAPSHOTS = 6

export interface CartItem {
  id: string
  name: string
  config: CakeConfig
  quantity: number
  /** Small JPEG data URL of the cake as it was designed, if the browser could take one. */
  snapshot?: string
}

export interface AddOptions {
  id: string
  name?: string
  snapshot?: string
}

/** Adds a cake; the same design twice becomes one line with a higher quantity. */
export function addItem(items: CartItem[], config: CakeConfig, options: AddOptions): CartItem[] {
  const key = configKey(config)
  const existing = items.find((item) => configKey(item.config) === key)
  if (existing) {
    return items.map((item) =>
      item === existing
        ? {
            ...item,
            quantity: Math.min(MAX_QUANTITY, item.quantity + 1),
            snapshot: options.snapshot ?? item.snapshot,
          }
        : item,
    )
  }
  const added: CartItem = {
    id: options.id,
    name: options.name ?? 'Your design',
    config,
    quantity: 1,
    snapshot: options.snapshot,
  }
  return trimSnapshots([...items, added])
}

export function setQuantity(items: CartItem[], id: string, quantity: number): CartItem[] {
  const clamped = Math.min(MAX_QUANTITY, Math.max(1, Math.round(quantity)))
  return items.map((item) => (item.id === id ? { ...item, quantity: clamped } : item))
}

export function removeItem(items: CartItem[], id: string): CartItem[] {
  return items.filter((item) => item.id !== id)
}

export const countItems = (items: CartItem[]) => items.reduce((sum, item) => sum + item.quantity, 0)

export const subtotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + priceOf(item.config) * item.quantity, 0)

function trimSnapshots(items: CartItem[]): CartItem[] {
  const keepFrom = items.length - MAX_SNAPSHOTS
  return items.map((item, index) =>
    index < keepFrom && item.snapshot ? { ...item, snapshot: undefined } : item,
  )
}

/** Reads a cart saved by any earlier version of the site, dropping whatever no longer makes sense. */
export function restoreItems(input: unknown): CartItem[] {
  if (!Array.isArray(input)) return []
  return input.flatMap((raw): CartItem[] => {
    if (typeof raw !== 'object' || raw === null) return []
    const item = raw as Record<string, unknown>
    if (typeof item.id !== 'string') return []
    const snapshot =
      typeof item.snapshot === 'string' && item.snapshot.startsWith('data:image/') ? item.snapshot : undefined
    return [
      {
        id: item.id,
        name: typeof item.name === 'string' ? item.name.slice(0, 60) : 'Your design',
        config: normalizeConfig(item.config),
        quantity: Math.min(MAX_QUANTITY, Math.max(1, Math.round(Number(item.quantity) || 1))),
        snapshot,
      },
    ]
  })
}
