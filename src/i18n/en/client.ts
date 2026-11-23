import type { client as vi } from '../vi/client'
import { cake } from './cake'
import { cart } from './cart'
import { common } from './common'
import { design } from './design'
import { home } from './home'
import { menu } from './menu'
import { scenes } from './scenes'

export const client: typeof vi = { common, cake, home, design, menu, cart, scenes }
