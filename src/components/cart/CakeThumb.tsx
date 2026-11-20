import { frostingOf, spongeOf, type CakeConfig } from '@/lib/cake'

/** The picture taken when the cake was added, or two colour swatches when there is none. */
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
        className={`${className} shrink-0 rounded-2xl border border-white/10 bg-abyss object-cover`}
      />
    )
  }
  return (
    <span
      aria-hidden
      className={`${className} grid shrink-0 place-items-center rounded-2xl border border-white/10 bg-abyss`}
    >
      <span className="flex -space-x-2">
        {[frostingOf(config).color, spongeOf(config).color].map((color, i) => (
          <span
            key={`${color}-${i}`}
            className="h-6 w-6 rounded-full border border-white/20 sm:h-8 sm:w-8"
            style={{ background: color }}
          />
        ))}
      </span>
    </span>
  )
}
