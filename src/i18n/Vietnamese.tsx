'use client'

import type { ReactNode } from 'react'
import { LangProvider } from './LangProvider'
import { client } from './vi/client'

/** The words of Vietnamese pages, in a chunk of their own: the other language's pages never download it. */
export function Vietnamese({ children }: { children: ReactNode }) {
  return (
    <LangProvider lang="vi" dict={client}>
      {children}
    </LangProvider>
  )
}
