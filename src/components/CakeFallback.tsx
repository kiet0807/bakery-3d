/** Flat drawing shown where 3D is not available. The shop still works around it. */
export function CakeFallback({ note = '3D is not available on this device, so here is a drawing instead.' }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
      <svg viewBox="0 0 200 170" className="w-3/5 max-w-[260px]" aria-hidden>
        <ellipse cx="100" cy="158" rx="78" ry="8" fill="#e9d6c4" />
        <rect x="38" y="78" width="124" height="74" rx="10" fill="#f6c1cf" />
        <rect x="38" y="104" width="124" height="8" fill="#d9405a" opacity="0.6" />
        <rect x="38" y="126" width="124" height="8" fill="#d9405a" opacity="0.6" />
        <path
          d="M38 92c8 0 8 14 16 14s8-14 16-14 8 18 16 18 8-18 16-18 8 12 16 12 8-12 16-12 8 16 16 16 8-16 14-16V80H38z"
          fill="#fbf6ee"
        />
        {[60, 84, 108, 132].map((x) => (
          <g key={x}>
            <circle cx={x + 4} cy="70" r="9" fill="#e0334d" />
            <path d={`M${x - 2} 62l6 -6 6 6z`} fill="#4f9a3c" />
          </g>
        ))}
      </svg>
      <p className="max-w-xs text-sm text-mist">{note}</p>
    </div>
  )
}
