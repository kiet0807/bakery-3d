'use client'

import Link from 'next/link'
import { createContext, use, type ComponentProps, type ReactNode } from 'react'
import { DEFAULT_LOCALE, localeHref, type Locale } from './config'
import { dictionaries } from './dictionaries'

const LangContext = createContext<Locale>(DEFAULT_LOCALE)

/** Set once in the root layout from the `[lang]` segment. */
export function LangProvider({ lang, children }: { lang: Locale; children: ReactNode }) {
  return <LangContext value={lang}>{children}</LangContext>
}

export const useLang = () => use(LangContext)

/** The dictionary of the page's language, for Client Components. */
export const useDict = () => dictionaries[use(LangContext)]

/** `next/link` that adds the language prefix: write `href="/menu"` and English pages link to `/en/menu`. */
export function LocalLink({ href, ...props }: ComponentProps<typeof Link> & { href: string }) {
  const lang = use(LangContext)
  return <Link href={localeHref(lang, href)} {...props} />
}
