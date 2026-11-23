/**
 * The vitrine's table dragged round by a mouse or a finger. The stage (a page element) reads the pointer and writes
 * here; the 3D scene turns the table from it. Kept outside both, so the page does not load the scene's code for it.
 */

/** A press that moves further than this many pixels turns the table: it is not a click on a cake. */
export const DRAG_START_PX = 8

export interface TableDrag {
  /** A drag is under way: the table follows it. */
  active: boolean
  /** How far, in cakes: 1 brings the next cake to the front, -1 the one before. */
  offset: number
  /** Asks the scene for a frame (it draws on demand). */
  wake: () => void
  /** The scene listens while it is on screen. */
  watch: (listener: () => void) => () => void
}

export function createTableDrag(): TableDrag {
  const listeners = new Set<() => void>()
  return {
    active: false,
    offset: 0,
    wake: () => listeners.forEach((listener) => listener()),
    watch: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
