import { cake } from './cake'
import { cart } from './cart'
import { common } from './common'
import { design } from './design'
import { home } from './home'
import { menu } from './menu'
import { scenes } from './scenes'

/** What Client Components say. The long pages (about, policies, FAQ) are only ever rendered on the server. */
export const client = { common, cake, home, design, menu, cart, scenes }
