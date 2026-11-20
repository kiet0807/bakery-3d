import { normalizeConfig, type CakeConfig } from './cake'

/**
 * The name that carries a whole cake design in a link. New links put it in the fragment (`/design#cake=…`), which
 * browsers never send to a server, so the message on the cake stays between the people sharing the link. Links
 * from before 2026-11-20 used the query (`/design?cake=…`); the builder still opens them.
 */
export const SHARE_PARAM = 'cake'

const toBase64Url = (bytes: Uint8Array) => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

/**
 * A design as a short, URL-safe token: the choices in a fixed order, JSON, UTF-8 (so Vietnamese messages
 * survive), base64url. About 120 characters, fine for a Zalo message.
 */
export function encodeCake(config: CakeConfig): string {
  const fields = [
    config.size,
    config.sponge,
    config.filling,
    config.frosting,
    config.drip,
    config.toppings.join('+'),
    config.sweetness,
    config.candles,
    config.message,
  ]
  return toBase64Url(new TextEncoder().encode(JSON.stringify(fields)))
}

/** Reads a token back. Anything broken or tampered with gives null; odd values are cleaned by normalizeConfig. */
export function decodeCake(token: string | null | undefined): CakeConfig | null {
  if (!token || token.length > 1000) return null
  try {
    const fields: unknown = JSON.parse(new TextDecoder().decode(fromBase64Url(token)))
    if (!Array.isArray(fields)) return null
    const [size, sponge, filling, frosting, drip, toppings, sweetness, candles, message] = fields
    return normalizeConfig({
      size,
      sponge,
      filling,
      frosting,
      drip,
      toppings: typeof toppings === 'string' && toppings ? toppings.split('+') : [],
      sweetness,
      candles,
      message,
    })
  } catch {
    return null
  }
}

/** The path (without language prefix) that opens this design in the builder. */
export const designPath = (config: CakeConfig) => `/design#${SHARE_PARAM}=${encodeCake(config)}`
