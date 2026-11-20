import { describe, expect, it } from 'vitest'
import { DEFAULT_CAKE, normalizeConfig, priceOf } from './cake'
import {
  MAX_QUANTITY,
  MAX_SNAPSHOTS,
  addItem,
  countItems,
  removeItem,
  restoreItems,
  setQuantity,
  subtotal,
  type CartItem,
} from './cart'

const chocolate = normalizeConfig({ sponge: 'chocolate', toppings: ['cherries'] })

describe('cart', () => {
  it('merges the same design into one line', () => {
    let items: CartItem[] = []
    items = addItem(items, DEFAULT_CAKE, { id: 'a' })
    items = addItem(items, { ...DEFAULT_CAKE, toppings: [...DEFAULT_CAKE.toppings].reverse() }, { id: 'b' })
    items = addItem(items, chocolate, { id: 'c', name: 'Midnight' })
    expect(items.map((i) => [i.id, i.quantity, i.name])).toEqual([
      ['a', 2, 'Your design'],
      ['c', 1, 'Midnight'],
    ])
    expect(countItems(items)).toBe(3)
    expect(subtotal(items)).toBe(2 * priceOf(DEFAULT_CAKE) + priceOf(chocolate))
  })

  it('keeps quantities between 1 and the maximum', () => {
    const items = addItem([], DEFAULT_CAKE, { id: 'a' })
    expect(setQuantity(items, 'a', 0)[0].quantity).toBe(1)
    expect(setQuantity(items, 'a', 500)[0].quantity).toBe(MAX_QUANTITY)
    expect(removeItem(items, 'a')).toEqual([])
  })

  it('keeps pictures only for the newest lines', () => {
    let items: CartItem[] = []
    for (let i = 0; i <= MAX_SNAPSHOTS; i++)
      items = addItem(items, normalizeConfig({ candles: i }), {
        id: `${i}`,
        snapshot: 'data:image/jpeg;base64,x',
      })
    expect(items[0].snapshot).toBeUndefined()
    expect(items.filter((i) => i.snapshot).length).toBe(MAX_SNAPSHOTS)
  })

  it('restores a saved cart and drops what no longer fits', () => {
    const restored = restoreItems([
      { id: 'ok', name: 'Mine', config: { size: 'mini' }, quantity: 3, snapshot: 'javascript:alert(1)' },
      { name: 'no id' },
      'junk',
      { id: 'big', config: {}, quantity: 999 },
    ])
    expect(restored).toHaveLength(2)
    expect(restored[0]).toMatchObject({ id: 'ok', name: 'Mine', quantity: 3, snapshot: undefined })
    expect(restored[0].config.size).toBe('mini')
    expect(restored[1].quantity).toBe(MAX_QUANTITY)
    expect(restoreItems('nope')).toEqual([])
  })
})
