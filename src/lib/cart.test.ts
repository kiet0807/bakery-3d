import { describe, expect, it } from 'vitest'
import { DEFAULT_CAKE, normalizeConfig, priceOf } from './cake'
import {
  MAX_QUANTITY,
  MAX_SNAPSHOTS,
  addItem,
  countItems,
  removeItem,
  replaceItem,
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
    items = addItem(items, chocolate, { id: 'c', presetId: 'choco-crush' })
    expect(items.map((i) => [i.id, i.quantity, i.presetId])).toEqual([
      ['a', 2, undefined],
      ['c', 1, 'choco-crush'],
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

  it('replaces a line in place, and merges it into a line with the same design', () => {
    let items: CartItem[] = []
    items = addItem(items, DEFAULT_CAKE, { id: 'a' })
    items = addItem(items, chocolate, { id: 'b', presetId: 'choco-crush' })
    items = setQuantity(items, 'b', 2)
    const taro = normalizeConfig({ sponge: 'taro' })
    const changed = replaceItem(items, 'b', taro, {})
    expect(changed.map((i) => [i.id, i.quantity, i.presetId, i.config.sponge])).toEqual([
      ['a', 1, undefined, DEFAULT_CAKE.sponge],
      ['b', 2, undefined, 'taro'],
    ])
    const merged = replaceItem(items, 'b', DEFAULT_CAKE, {})
    expect(merged.map((i) => [i.id, i.quantity])).toEqual([['b', 3]])
    expect(replaceItem(items, 'gone', taro, {})).toBe(items)
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
      {
        id: 'ok',
        presetId: 'taro-dream',
        config: { size: 's14' },
        quantity: 3,
        snapshot: 'javascript:alert(1)',
      },
      { name: 'no id' },
      'junk',
      { id: 'big', presetId: 'not-a-cake', name: 'Old name', config: { size: 'mini' }, quantity: 999 },
    ])
    expect(restored).toHaveLength(2)
    expect(restored[0]).toMatchObject({ id: 'ok', presetId: 'taro-dream', quantity: 3, snapshot: undefined })
    expect(restored[0].config.size).toBe('s14')
    expect(restored[1].presetId).toBeUndefined()
    expect(restored[1]).not.toHaveProperty('name')
    expect(restored[1].config.size).toBe(DEFAULT_CAKE.size)
    expect(restored[1].quantity).toBe(MAX_QUANTITY)
    expect(restoreItems('nope')).toEqual([])
  })
})
