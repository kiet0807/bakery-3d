/** Shown while a 3D scene downloads, so the layout never jumps. */
export function ScenePoster({ label = 'Warming up the oven…' }: { label?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4" aria-hidden>
      <div className="h-24 w-24 animate-pulse rounded-full bg-moon/10 shadow-glow" />
      <p className="eyebrow">{label}</p>
    </div>
  )
}
