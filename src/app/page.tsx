import Link from 'next/link'
import { HomeExperience } from '@/components/home/HomeExperience'
import { frostingOf, spongeOf } from '@/lib/cake'
import { money } from '@/lib/money'
import { PRESETS, presetPrice } from '@/lib/presets'

const CRAFT = [
  {
    title: 'Procedural, not downloaded',
    body: 'Every cake is generated from your choices: turned frosting, canvas-painted layers, instanced sprinkles. There is not a single 3D file to load.',
  },
  {
    title: 'Slice to see inside',
    body: 'The slice is its own wedge, cut to fit the body exactly. Pull it out and the real layers are there, in the flavours you picked.',
  },
  {
    title: 'Lit by a real café',
    body: 'Reflections come from a photographed café interior. On a desktop, "Studio photo" path-traces the cake ray by ray into a picture you can keep.',
  },
  {
    title: 'Fast on any device',
    body: 'Two quality tiers, picked from the device and corrected by the measured frame rate. Scenes stop drawing when they leave the screen.',
  },
  {
    title: 'Made for everyone',
    body: 'Reduced-motion mode, keyboard-friendly controls, and a 2D drawing wherever WebGL is not available. The shop works either way.',
  },
  {
    title: 'Built with',
    body: 'Next.js 16, React 19, three.js, React Three Fiber, drei and postprocessing, Lenis, zustand and Tailwind CSS.',
  },
]

export default function Home() {
  return (
    <>
      <HomeExperience />

      <section aria-labelledby="craft-title" className="mx-auto max-w-7xl px-4 pt-24 sm:px-8">
        <p className="eyebrow mb-4">Behind the glass</p>
        <h2
          id="craft-title"
          className="max-w-3xl text-[clamp(2rem,4.4vw,3.6rem)] leading-[1.05] font-light tracking-tight"
        >
          A bakery that runs entirely <span className="text-accent">in your browser.</span>
        </h2>
        <ul className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {CRAFT.map((item, index) => (
            <li key={item.title} className="space-y-3 bg-abyss/90 p-7 sm:p-8">
              <p className="font-display text-sm tracking-[0.2em] text-moon">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="text-xl font-medium">{item.title}</h3>
              <p className="leading-relaxed text-mist">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="vitrine-title" className="mx-auto max-w-7xl px-4 pt-28 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-4">The vitrine</p>
            <h2
              id="vitrine-title"
              className="text-[clamp(2rem,4.4vw,3.6rem)] leading-[1.05] font-light tracking-tight"
            >
              Six house cakes, <span className="text-accent">ready to change.</span>
            </h2>
          </div>
          <Link
            href="/menu"
            className="rounded-full border border-white/40 px-6 py-3 text-sm font-medium tracking-[0.12em] uppercase transition-colors hover:border-moon hover:text-moon"
          >
            See them in 3D
          </Link>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRESETS.map((preset) => (
            <li key={preset.id}>
              <Link
                href={`/design?preset=${preset.id}`}
                className="group glass flex h-full flex-col gap-4 rounded-3xl p-6 transition-colors hover:border-moon/50"
              >
                <span className="flex items-center gap-2" aria-hidden>
                  {[frostingOf(preset.config).color, spongeOf(preset.config).color].map((color) => (
                    <span
                      key={color}
                      className="h-6 w-6 rounded-full border border-white/20"
                      style={{ background: color }}
                    />
                  ))}
                </span>
                <span className="text-2xl font-light">{preset.name}</span>
                <span className="flex-1 leading-relaxed text-mist">{preset.tagline}</span>
                <span className="flex items-center justify-between text-sm">
                  <span className="tabular-nums">{money(presetPrice(preset))}</span>
                  <span className="text-moon transition-transform group-hover:translate-x-1">
                    Make it yours →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
