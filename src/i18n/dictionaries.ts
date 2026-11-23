import type { Locale } from './config'
import { en } from './en'
import { vi } from './vi'

export type Dictionary = typeof vi

/** The part Client Components use (`useDict`): without the long server-rendered pages. */
export type ClientDictionary = Omit<Dictionary, 'pages'>

/** Both languages, whole: for Server Components, metadata and tests. A Client Component importing this would ship it all. */
export const dictionaries: Record<Locale, Dictionary> = { vi, en }
