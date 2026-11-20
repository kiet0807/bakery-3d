'use client'

import { useDict } from '@/i18n/LangProvider'

/** Shown while a 3D scene downloads, so the layout never jumps. */
export function ScenePoster({ label }: { label?: string }) {
  const { scenes } = useDict()
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4" aria-hidden>
      <div className="relative h-24 w-24">
        <div className="absolute inset-0 animate-pulse rounded-full bg-mint/45" />
        <div className="absolute inset-5 animate-pulse rounded-full bg-peach/50 [animation-delay:300ms]" />
      </div>
      <p className="eyebrow">{label ?? scenes.loading}</p>
    </div>
  )
}
