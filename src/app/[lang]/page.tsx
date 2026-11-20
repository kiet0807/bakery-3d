import type { Metadata } from 'next'
import { HomeExperience } from '@/components/home/HomeExperience'
import { NoticeCard } from '@/components/info/NoticeCard'
import { SectionHeading } from '@/components/info/SectionHeading'
import { dictionaries } from '@/i18n/dictionaries'
import { LocalLink } from '@/i18n/LangProvider'
import { langFrom, pageMetadata } from '@/i18n/metadata'
import { frostingOf, sizeOf, spongeOf } from '@/lib/cake'
import { leadHours } from '@/lib/leadTime'
import { money } from '@/lib/money'
import { PRESETS, presetPrice } from '@/lib/presets'

export async function generateMetadata({ params }: PageProps<'/[lang]'>): Promise<Metadata> {
  const lang = await langFrom(params)
  return pageMetadata(lang, '/', dictionaries[lang].home.meta, { absoluteTitle: true })
}

export default async function Home({ params }: PageProps<'/[lang]'>) {
  const lang = await langFrom(params)
  const dict = dictionaries[lang]
  const { home } = dict
  return (
    <>
      <HomeExperience />

      <section aria-labelledby="why-title" className="mx-auto max-w-7xl px-4 pt-24 sm:px-8">
        <SectionHeading
          id="why-title"
          eyebrow={home.why.eyebrow}
          title={home.why.title}
          accent={home.why.accent}
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {home.why.items.map((item, index) => (
            <li
              key={item.title}
              className={`card flex gap-4 p-6 ${index % 2 ? 'lg:translate-y-4' : ''} transition-transform motion-safe:hover:-rotate-1`}
            >
              <span
                aria-hidden
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-soft text-2xl"
              >
                {item.icon}
              </span>
              <span className="space-y-1.5">
                <span className="block font-display text-xl font-bold">{item.title}</span>
                <span className="block leading-relaxed text-muted">{item.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="cakes-title" className="mx-auto max-w-7xl px-4 pt-28 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            id="cakes-title"
            eyebrow={home.cakes.eyebrow}
            title={home.cakes.title}
            accent={home.cakes.accent}
          />
          <LocalLink href="/menu" className="btn btn-ghost">
            {home.cakes.all}
          </LocalLink>
        </div>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRESETS.map((preset) => {
            const words = dict.cake.presets[preset.id]
            const size = sizeOf(preset.config)
            return (
              <li key={preset.id}>
                <LocalLink
                  href={`/design?preset=${preset.id}`}
                  className="group card flex h-full flex-col gap-4 p-6 transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-sticker"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex items-center" aria-hidden>
                      {[frostingOf(preset.config).color, spongeOf(preset.config).color].map((color, i) => (
                        <span
                          key={color}
                          className={`h-9 w-9 rounded-full border-2 border-ink ${i ? '-ml-2.5' : ''}`}
                          style={{ background: color }}
                        />
                      ))}
                    </span>
                    <span className="chip rotate-2">
                      {home.cakes.lead(leadHours(preset.config, preset.id))}
                    </span>
                  </span>
                  <span className="font-display text-2xl leading-tight font-extrabold">{words.name}</span>
                  <span className="text-sm font-semibold text-leaf">
                    {dict.cake.sizes[size.id].name} · {dict.common.units.serves(size.serves)}
                  </span>
                  <span className="flex-1 leading-relaxed text-muted">{words.tagline}</span>
                  <span className="flex items-center justify-between gap-3 border-t border-line pt-4">
                    <span className="font-display text-2xl font-extrabold tabular-nums">
                      {money(presetPrice(preset), lang)}
                    </span>
                    <span className="font-display font-bold text-buy transition-transform group-hover:translate-x-1">
                      {home.cakes.cta} <span aria-hidden>→</span>
                    </span>
                  </span>
                </LocalLink>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="steps-title" className="mx-auto max-w-7xl px-4 pt-28 sm:px-8">
        <SectionHeading
          id="steps-title"
          eyebrow={home.steps.eyebrow}
          title={home.steps.title}
          accent={home.steps.accent}
        />
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {home.steps.items.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-3xl border-2 border-dashed border-edge/60 p-6 pt-8"
            >
              <span
                aria-hidden
                className="absolute -top-5 left-6 grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-buy font-display text-lg font-extrabold text-white shadow-sticker"
              >
                {index + 1}
              </span>
              <h3 className="font-display text-xl font-bold">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label={dict.common.notice.badge} className="mx-auto max-w-4xl px-4 pt-28 sm:px-8">
        <NoticeCard lang={lang} title={home.notice.title} linkLabel={home.notice.more} />
      </section>

      <section aria-labelledby="tech-title" className="mx-auto max-w-7xl px-4 pt-28 sm:px-8">
        <div className="rounded-[2rem] bg-soft p-6 sm:p-10">
          <SectionHeading
            id="tech-title"
            eyebrow={home.tech.eyebrow}
            title={home.tech.title}
            accent={home.tech.accent}
          >
            <p className="max-w-2xl text-lg leading-relaxed text-muted">{home.tech.lead}</p>
          </SectionHeading>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {home.tech.cards.map((card) => (
              <li key={card.title} className="space-y-2 rounded-2xl bg-surface p-5">
                <span aria-hidden className="text-2xl">
                  {card.icon}
                </span>
                <h3 className="font-display text-lg font-bold">{card.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{card.body}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <h3 className="sr-only">{home.tech.stackLabel}</h3>
            <ul aria-label={home.tech.stackLabel} className="flex flex-wrap gap-2">
              {home.tech.stack.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-ink/15 bg-surface px-3 py-1 text-sm font-semibold"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="final-title" className="mx-auto max-w-5xl px-4 pt-28 sm:px-8">
        <div className="sticker relative overflow-hidden bg-peach-soft px-6 py-12 text-center sm:px-12">
          <h2
            id="final-title"
            className="font-display text-[clamp(2rem,5vw,3.6rem)] leading-[1.05] font-extrabold tracking-tight"
          >
            {home.final.title}
            <span className="mark">{home.final.accent}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">{home.final.body}</p>
          <p className="mt-8 flex flex-wrap justify-center gap-3">
            <LocalLink href="/design" className="btn btn-buy px-7 py-3.5 text-lg">
              {home.final.design}
            </LocalLink>
            <LocalLink href="/menu" className="btn btn-ghost px-7 py-3.5 text-lg">
              {home.final.menu}
            </LocalLink>
          </p>
        </div>
      </section>
    </>
  )
}
