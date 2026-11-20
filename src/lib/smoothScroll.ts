import type Lenis from 'lenis'

/**
 * The one smooth-scroll instance of the page (made by `SmoothScroll` in the root layout), or null when the visitor
 * asked for less motion, before it starts, or on a page without it. Code that scrolls on purpose goes through
 * `scrollToElement`, so a programmatic scroll and the wheel share the same glide.
 */
let current: Lenis | null = null

export const setSmoothScroll = (lenis: Lenis | null) => {
  current = lenis
}

export const getSmoothScroll = () => current

/** Scrolls an element to the middle of the screen: with Lenis's glide when it runs, natively otherwise. */
export function scrollToElement(element: HTMLElement, { smooth }: { smooth: boolean }) {
  const lenis = current
  if (lenis && smooth) {
    const offset = -Math.max(0, (window.innerHeight - element.offsetHeight) / 2)
    lenis.scrollTo(element, { offset, duration: 1.1, easing: easeInOutCubic })
    return
  }
  element.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' })
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
