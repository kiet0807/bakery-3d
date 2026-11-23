'use client'

import type { ReactNode } from 'react'
import { LangProvider } from './LangProvider'
import { client } from './en/client'

/** The words of English pages, in a chunk of their own: the other language's pages never download it. */
export function English({ children }: { children: ReactNode }) {
  return (
    <LangProvider lang="en" dict={client}>
      {children}
    </LangProvider>
  )
}
