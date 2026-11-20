'use client'

import { useSyncExternalStore } from 'react'
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

export function setPalette(id: PaletteId) {
  document.documentElement.setAttribute('data-palette', id)
  try {
    window.localStorage.setItem(PALETTE_KEY, id)
  } catch {
    // Storage blocked (private mode): the palette still changes for this page.
  }
  listeners.forEach((listener) => listener())
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
