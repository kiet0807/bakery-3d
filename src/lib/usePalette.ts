'use client'

import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'
import { DEFAULT_PALETTE, PALETTE_KEY, isPaletteId, type PaletteId } from './palettes'

/**
 * The palette in use lives on `<html data-palette>`: the inline script in <head> sets it from storage before the
 * first paint, and `setPalette` changes it. Components (the switch, the 3D scenes) subscribe here.
 */
const listeners = new Set<() => void>()

export function readPalette(): PaletteId {
  const value = document.documentElement.getAttribute('data-palette')
  return isPaletteId(value) ? value : DEFAULT_PALETTE
}

function applyPalette(id: PaletteId) {
  document.documentElement.setAttribute('data-palette', id)
  try {
    window.localStorage.setItem(PALETTE_KEY, id)
  } catch {
    // Storage blocked (private mode): the palette still changes for this page.
  }
  listeners.forEach((listener) => listener())
}

/**
 * Switches the set. Where the browser has view transitions, the old colours cross-fade into the new ones over the
 * whole page (380 ms, see globals.css) instead of snapping; React renders the new set inside the transition
 * (flushSync), so the switch's own tick and name change in the same frame as the colours. A transition that is
 * skipped (a hidden tab) still applies the set. While one cross-fade runs, a further change (arrow keys held
 * through the sets) applies at once inside it instead of starting another: transitions never pile up, and the set
 * on the page is always the last one chosen.
 */
let running = false

export function setPalette(id: PaletteId) {
  const root = document.documentElement
  if (running || readPalette() === id || typeof document.startViewTransition !== 'function') {
    applyPalette(id)
    return
  }
  running = true
  root.setAttribute('data-view-transition', 'palette')
  const transition = document.startViewTransition(() => flushSync(() => applyPalette(id)))
  const done = () => {
    running = false
    if (root.getAttribute('data-view-transition') === 'palette') root.removeAttribute('data-view-transition')
  }
  transition.ready.catch(() => {})
  transition.finished.then(done, done)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Another tab changed the palette: follow it.
  const onStorage = (event: StorageEvent) => {
    if (event.key === PALETTE_KEY && isPaletteId(event.newValue)) setPalette(event.newValue)
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** The palette in use. The server (and the first hydration pass) render the default. */
export const usePalette = (): PaletteId => useSyncExternalStore(subscribe, readPalette, () => DEFAULT_PALETTE)
