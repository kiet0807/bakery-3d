import { NextResponse, type NextRequest } from 'next/server'
import { DEFAULT_LOCALE, LOCALES } from '@/i18n/config'

/**
 * Vietnamese is the default language and has no prefix in the address bar.
 * - `/menu` is served from `/vi/menu` (a rewrite: the address stays `/menu`).
 * - `/vi/menu` redirects to `/menu`, so each page has one address per language.
 * - `/en/...` is served as is.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hidden = `/${DEFAULT_LOCALE}`
  if (pathname === hidden || pathname.startsWith(`${hidden}/`)) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.slice(hidden.length) || '/'
    return NextResponse.redirect(url, 308)
  }
  const prefixed = LOCALES.some((lang) => pathname === `/${lang}` || pathname.startsWith(`/${lang}/`))
  if (prefixed) return NextResponse.next()
  const url = request.nextUrl.clone()
  url.pathname = `${hidden}${pathname === '/' ? '' : pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  // Everything except Next's own files and anything with a file extension (fonts, HDRI, icons, sitemap.xml).
  matcher: ['/((?!_next/|api/|.*\\.[a-zA-Z0-9]+$).*)'],
}
