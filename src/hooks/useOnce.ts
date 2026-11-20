'use client'

import { useCallback, useSyncExternalStore } from 'react'

/** Where a hint remembers it has been shown: `kais-bakery-hint-<name>` in localStorage. */
export const HINT_PREFIX = 'kais-bakery-hint-'

/** The hint on screen now, if any: one at a time, so two never talk over each other. */
let onScreen: string | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())
const subscribe = (onChange: () => void) => {
  listeners.add(onChange)
  return () => void listeners.delete(onChange)
}

function seen(name: string) {
  try {
    return window.localStorage.getItem(HINT_PREFIX + name) === '1'
  } catch {
    // No storage (some private modes): better no hint at all than the same hint on every page.
    return true
  }
}

/**
 * For a hint shown once per browser, one hint at a time.
 * - `due`: not shown in this browser yet, and no other hint is on screen. False on the server and during
 *   hydration, so a hint only ever appears once the page is interactive.
 * - `start()`: takes the screen; false if another hint got there first (then wait for `due` again).
 * - `done()`: remembers it for good and frees the screen. A hint keeps its own "on screen" state and calls it when
 *   it leaves: `due` turning false must not cut it short.
 */
export function useOnce(name: string) {
  const due = useSyncExternalStore(
    subscribe,
    () => !seen(name) && (onScreen === null || onScreen === name),
    () => false,
  )
  const start = useCallback(() => {
    if (onScreen !== null && onScreen !== name) return false
    onScreen = name
    notify()
    return true
  }, [name])
  const done = useCallback(() => {
    try {
      window.localStorage.setItem(HINT_PREFIX + name, '1')
    } catch {
      // Nothing to remember it in: `seen` already treats that as shown.
    }
    if (onScreen === name) onScreen = null
    notify()
  }, [name])
  return { due, start, done }
}
