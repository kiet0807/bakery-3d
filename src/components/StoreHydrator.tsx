'use client'

import { useEffect } from 'react'
import { rehydrateStores } from '@/lib/store'

/** Loads the saved cart and design once the page is interactive. */
export function StoreHydrator() {
  useEffect(() => {
    rehydrateStores()
  }, [])
  return null
}
