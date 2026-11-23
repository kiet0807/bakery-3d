'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import type { Locale } from './config'

// Each language's words are a chunk of their own, rendered on the server and preloaded by the pages that use it, so
// nobody downloads the other language. (Chosen in the root layout itself, both land in the layout's one chunk.)
const English = dynamic(() => import('./English').then((module) => module.English))
const Vietnamese = dynamic(() => import('./Vietnamese').then((module) => module.Vietnamese))

/** The page's language and its words, for every Client Component below. */
export function Words({ lang, children }: { lang: Locale; children: ReactNode }) {
  return lang === 'en' ? <English>{children}</English> : <Vietnamese>{children}</Vietnamese>
}
