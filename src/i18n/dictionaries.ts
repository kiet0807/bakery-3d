import type { Locale } from './config'
import { en } from './en'
import { vi } from './vi'

export type Dictionary = typeof vi

export const dictionaries: Record<Locale, Dictionary> = { vi, en }
