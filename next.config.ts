import type { NextConfig } from 'next'

/**
 * Headers for every response. The site has no forms that post anywhere, no third-party scripts and nothing to
 * embed, so it can refuse framing, sniffing and device APIs outright. A script CSP would need a per-request
 * nonce, which would turn the prerendered pages dynamic; the directives below need none.
 */
const SECURITY_HEADERS = [
  {
    key: 'Content-Security-Policy',
    value: [
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "frame-src 'none'",
      // Pictures and fonts from here, data: URLs (palette sprinkles, cart snapshots) and blobs (3D textures). The
      // 3D text's worker is a blob; nothing is ever fetched from, or sent to, another site.
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "media-src 'none'",
      "worker-src 'self' blob:",
      ...(process.env.NODE_ENV === 'development' ? [] : ["connect-src 'self' data: blob:"]),
    ].join('; '),
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  headers: async () => [{ source: '/:path*', headers: SECURITY_HEADERS }],
  cacheComponents: true,
  // One 404 page for every unmatched address; the root layout lives under [lang], so it cannot compose one.
  experimental: { globalNotFound: true },
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
