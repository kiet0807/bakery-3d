'use client'

import { useDict } from '@/i18n/LangProvider'

/**
 * Flat drawing shown where 3D is not available. The shop still works around it. Outline, plate, shadow and the
 * sprinkles around the cake use the palette's tokens, so they follow the chosen set; the cake itself (strawberry
 * frosting, cream, berries) is food and keeps its colours.
 */
export function CakeFallback({ note }: { note?: string }) {
  const { scenes } = useDict()
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
      <svg viewBox="0 0 200 180" className="w-3/5 max-w-[260px]" aria-hidden>
        <ellipse cx="100" cy="168" rx="80" ry="8" className="fill-ink" opacity="0.12" />
        <path
          d="M30 152h140l-8 10H38z"
          className="fill-surface stroke-ink"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <rect
          x="38"
          y="80"
          width="124"
          height="72"
          rx="12"
          fill="#f6c1cf"
          className="stroke-ink"
          strokeWidth="3"
        />
        <rect x="40" y="106" width="120" height="7" fill="#d9405a" opacity="0.55" />
        <rect x="40" y="128" width="120" height="7" fill="#d9405a" opacity="0.55" />
        <path
          d="M38 94c8 0 8 14 16 14s8-14 16-14 8 18 16 18 8-18 16-18 8 12 16 12 8-12 16-12 8 16 16 16 8-16 14-16V82H38z"
          fill="#fbf6ee"
        />
        {[60, 84, 108, 132].map((x) => (
          <g key={x}>
            <circle cx={x + 4} cy="72" r="9" fill="#e0334d" className="stroke-ink" strokeWidth="2.5" />
            <path d={`M${x - 2} 64l6 -6 6 6z`} fill="#4f9a3c" />
          </g>
        ))}
        {(
          [
            [24, 40, 'fill-mint'],
            [176, 52, 'fill-peach'],
            [168, 18, 'fill-butter'],
            [34, 12, 'fill-berry'],
          ] as const
        ).map(([x, y, fill]) => (
          <rect key={x} x={x} y={y} width="12" height="5" rx="2.5" className={fill} />
        ))}
      </svg>
      <p className="max-w-xs text-sm text-muted">{note ?? scenes.fallback}</p>
    </div>
  )
}
