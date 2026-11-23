'use client'

import { lazy, Suspense, useState, useSyncExternalStore, type ComponentType, type ReactNode } from 'react'

/**
 * The 3D scenes' code. Each page loads its scene only when it opens (three.js and the scene are far bigger than
 * the page), and once a first scene is on screen the others load in quiet moments, so a page opened later finds
 * its scene ready.
 */

const noSubscription = () => () => {}
const inBrowser = () => true
const onServer = () => false

type SceneProps<P> = P & {
  /** Shown while the scene's code loads, and in the server's page (scenes are drawn in the browser only). */
  fallback: ReactNode
}

export type LazyScene<P> = ComponentType<SceneProps<P>> & { preload: () => Promise<unknown> }

/**
 * Like `next/dynamic` with `ssr: false`, with one difference: a scene whose code is already here renders at once.
 * `next/dynamic` suspends even then, for a moment, so the page first showed its fallback (the loading poster), and
 * React holds what replaces a fallback for 300 ms so it never flashes: with its code ready, a scene still came a
 * third of a second late.
 */
function lazyScene<P extends object>(load: () => Promise<{ default: ComponentType<P> }>): LazyScene<P> {
  let ready: ComponentType<P> | null = null
  let loading: Promise<{ default: ComponentType<P> }> | null = null
  const preload = () =>
    (loading ??= load().then(
      (module) => {
        ready = module.default
        return module
      },
      (error: unknown) => {
        // A failed download may be tried again (offline for a moment).
        loading = null
        throw error
      },
    ))
  const Lazy = lazy(preload)
  function Scene({ fallback, ...props }: SceneProps<P>) {
    const browser = useSyncExternalStore(noSubscription, inBrowser, onServer)
    // Chosen once for this page: changing from one to the other would build the scene anew.
    const [Code] = useState<ComponentType<P>>(() => ready ?? Lazy)
    if (!browser) return fallback
    return (
      <Suspense fallback={fallback}>
        <Code {...(props as P)} />
      </Suspense>
    )
  }
  return Object.assign(Scene, { preload })
}

export const DesignScene = lazyScene(() => import('./scenes/DesignScene'))
export const VitrineScene = lazyScene(() => import('./scenes/VitrineScene'))
export const StoryScene = lazyScene(() => import('./scenes/StoryScene'))
export const BoxScene = lazyScene(() => import('./scenes/BoxScene'))

/** Runs `task` when the browser has a quiet moment (Safari before 18 has no idle callback: a short wait instead). */
function whenIdle(task: () => void) {
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(task, { timeout: 4000 })
  else window.setTimeout(task, 1500)
}

/** A scene has drawn on this page: the device draws 3D, and the 3D code the scenes share is loaded. */
let drawn = false
let boxQueued = false
const queue: { preload: () => Promise<unknown> }[] = []
let busy = false

/**
 * One scene at a time, each in an idle moment, so running its code never lands in the middle of a scroll or a
 * turn. A failed download is simply not ready early: the page loads it again when it opens.
 */
function loadNext() {
  if (busy || !queue.length) return
  busy = true
  whenIdle(() => {
    queue
      .shift()!
      .preload()
      .catch(() => {})
      .finally(() => {
        busy = false
        loadNext()
      })
  })
}

/** Not with Data Saver on: a visitor counting bytes pays for a scene only when opening it. */
function enqueue(...scenes: { preload: () => Promise<unknown> }[]) {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (connection?.saveData) return
  queue.push(...scenes)
  loadNext()
}

/**
 * Called once a scene is on screen: the others load in quiet moments, in the order visitors most often open them.
 * The box is left out: it ends checkout, see `prefetchBox`.
 */
export function prefetchScenes() {
  if (drawn) return
  drawn = true
  enqueue(DesignScene, VitrineScene, StoryScene)
}

/** Called on the last step of checkout, if a scene has drawn on this page (so the box can be drawn too). */
export function prefetchBox() {
  if (!drawn || boxQueued) return
  boxQueued = true
  enqueue(BoxScene)
}
