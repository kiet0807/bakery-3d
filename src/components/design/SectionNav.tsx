'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useDict } from '@/i18n/LangProvider'
import { getSmoothScroll } from '@/lib/smoothScroll'

/** Room between the bar and the section it scrolled to, in pixels. */
const GAP = 14

/**
 * Below the stage on phones and tablets: the builder is nine groups of choices long, about eight screens of one
 * column, and this jumps between them and says where you are. On a wide screen the choices sit beside the stage,
 * two to a row, and the list is short enough without it.
 */
export function SectionNav({
  sections,
  stageRef,
}: {
  sections: { id: string; title: string }[]
  /** The 3D stage the bar hangs under: sections stop below both. */
  stageRef: RefObject<HTMLElement | null>
}) {
  const { design } = useDict()
  const reduced = useReducedMotion()
  const bar = useRef<HTMLElement>(null)
  const list = useRef<HTMLOListElement>(null)
  const [active, setActive] = useState(0)
  const ids = sections.map((section) => section.id).join(' ')

  /** Where the part of the screen free for choices begins, once the bar has stuck under the stage. */
  const top = () => (stageRef.current?.getBoundingClientRect().bottom ?? 0) + (bar.current?.offsetHeight ?? 0)

  useEffect(() => {
    let frame = 0
    const check = () => {
      frame = 0
      if (!bar.current?.offsetHeight) return
      const line = top() + GAP + 40
      const tops = ids
        .split(' ')
        .map((id) => document.getElementById(id)?.getBoundingClientRect().top ?? Infinity)
      setActive(
        Math.max(
          0,
          tops.findLastIndex((y) => y <= line),
        ),
      )
    }
    const schedule = () => (frame ||= requestAnimationFrame(check))
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    schedule()
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(frame)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `top` only reads refs
  }, [ids])

  // Keeps the pill of the section on screen in view, sideways only.
  useEffect(() => {
    const strip = list.current
    const pill = strip?.children[active]
    if (!strip || !(pill instanceof HTMLElement)) return
    const left = pill.offsetLeft - (strip.clientWidth - pill.offsetWidth) / 2
    strip.scrollTo({ left, behavior: reduced ? 'auto' : 'smooth' })
  }, [active, reduced])

  const goTo = (id: string) => {
    const section = document.getElementById(id)
    if (!section) return
    const y = window.scrollY + section.getBoundingClientRect().top - top() - GAP
    const lenis = getSmoothScroll()
    if (lenis) lenis.scrollTo(y, { duration: 0.7, immediate: reduced })
    else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <nav
      ref={bar}
      aria-label={design.sectionsLabel}
      className="sticky top-[calc(4rem+var(--stage))] z-10 -mx-3 border-b border-line bg-cream/95 backdrop-blur-md transition-[top] delay-300 duration-0 group-has-[[data-typing]:focus]/builder:delay-0 sm:top-[calc(5rem+var(--stage))] sm:rounded-b-2xl lg:hidden"
    >
      <ol
        ref={list}
        data-lenis-prevent-wheel
        className="relative flex gap-1.5 overflow-x-auto px-3 py-1.5 [scrollbar-width:none]"
      >
        {sections.map((section, index) => (
          <li key={section.id} className="shrink-0">
            <button
              type="button"
              onClick={() => goTo(section.id)}
              aria-current={active === index ? 'true' : undefined}
              className="h-9 rounded-full border-2 border-line bg-surface px-3 font-display text-sm font-semibold whitespace-nowrap text-muted transition-colors aria-[current]:border-ink aria-[current]:bg-butter aria-[current]:text-ink"
            >
              {section.title}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
