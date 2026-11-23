'use client'

import Link from 'next/link'
import { createContext, use, type ComponentProps, type ReactNode } from 'react'
import { DEFAULT_LOCALE, localeHref, type Locale } from './config'
import type { ClientDictionary } from './dictionaries'

const LangContext = createContext<Locale>(DEFAULT_LOCALE)

const DictContext = createContext<ClientDictionary | null>(null)

/** Set once in the root layout from the `[lang]` segment, through `Vietnamese` or `English`. */
export function LangProvider({
  lang,
  dict,
  children,
}: {
  lang: Locale
  dict: ClientDictionary
  children: ReactNode
}) {
  return (
    <LangContext value={lang}>
      <DictContext value={dict}>{children}</DictContext>
    </LangContext>
  )
}

export const useLang = () => use(LangContext)

/** The dictionary of the page's language, for Client Components. */
export function useDict(): ClientDictionary {
  const dict = use(DictContext)
  if (!dict) throw new Error('useDict needs the Vietnamese or English provider of the root layout above it.')
  return dict
}

/** `next/link` that adds the language prefix: write `href="/menu"` and English pages link to `/en/menu`. */
export function LocalLink({ href, ...props }: ComponentProps<typeof Link> & { href: string }) {
  const lang = use(LangContext)
  return <Link href={localeHref(lang, href)} {...props} />
}
