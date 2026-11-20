import { ViewTransition, type ReactNode } from 'react'

/**
 * Wraps one page's content so a client navigation animates it (the CSS is in globals.css): the old page fades out
 * fast, the new one fades in and rises a little. It goes in each page, not in the layout: the layout stays mounted
 * across navigations, so only a page enters and exits. `default="none"` keeps it still for every other transition
 * (a colour set change, a cart line removed).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  )
}
