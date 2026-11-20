'use client'

import { useSyncExternalStore } from 'react'
import { useCart } from './store'

const subscribe = (onChange: () => void) => useCart.persist.onFinishHydration(onChange)
const read = () => useCart.persist.hasHydrated()

/**
 * False until the saved cart has been read from the browser. Pages that show the cart wait for it, so a full
 * cart never flashes "empty" for a frame.
 */
export function useCartHydrated(): boolean {
  return useSyncExternalStore(subscribe, read, () => false)
}
