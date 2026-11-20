import { frostingOf, spongeOf, type CakeConfig } from '@/lib/cake'

/** The picture taken when the cake was added, or a little drawn cake in its colours when there is none. */
export function CakeThumb({
  config,
  snapshot,
  className = 'h-24 w-24',
}: {
  config: CakeConfig
  snapshot?: string
  className?: string
}) {
  if (snapshot) {
    return (
      // A data URL made in this browser: next/image would only add work here. The cake's name is printed
      // right beside the picture, so the image itself stays silent for screen readers.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={snapshot}
        alt=""
        width={256}
        height={256}
        className={`${className} shrink-0 rounded-2xl border-2 border-ink bg-soft object-cover`}
      />
    )
  }
  const frosting = frostingOf(config).color
  const sponge = spongeOf(config).color
  return (
    <span
      aria-hidden
      className={`${className} grid shrink-0 place-items-center rounded-2xl border-2 border-ink bg-soft`}
    >
      <svg viewBox="0 0 48 48" className="h-3/4 w-3/4" fill="none" strokeLinejoin="round">
        <rect x="8" y="20" width="32" height="20" rx="5" fill={sponge} stroke="#1f3d36" strokeWidth="2" />
        <path d="M8 30h32" stroke={frosting} strokeWidth="3" />
        <path
          d="M8 25c0-3 2-5 5-5h22c3 0 5 2 5 5v1c-2 2.4-4 2.4-5.4 0-1.4 2.4-4 2.4-5.4 0-1.4 2.4-4 2.4-5.4 0-1.4 2.4-4 2.4-5.4 0-1.4 2.4-3.4 2.4-5.4 0z"
          fill={frosting}
          stroke="#1f3d36"
          strokeWidth="2"
        />
        <circle cx="24" cy="14" r="4" fill="#f2789f" stroke="#1f3d36" strokeWidth="2" />
      </svg>
    </span>
  )
}
