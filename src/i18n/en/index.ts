import type { vi } from '../vi'
import { client } from './client'
import { pages } from './pages'

export const en: typeof vi = { ...client, pages }
