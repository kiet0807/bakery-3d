'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

const read = () =>
  typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(QUERY).matches : false

/** Follows the system "reduce motion" setting live. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, read, () => false)
}
