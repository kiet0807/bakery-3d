import type { Metadata } from 'next'
import { Icon } from '@/components/Icon'
import { ContactLinks } from '@/components/info/ContactLinks'
import { DeliveryAreas } from '@/components/info/DeliveryAreas'
import { SectionHeading } from '@/components/info/SectionHeading'
import { signTime } from '@/components/info/time'
import { dictionaries } from '@/i18n/dictionaries'
import { langFrom, pageMetadata } from '@/i18n/metadata'
import { SHOP } from '@/lib/shop'
import { PageTransition } from '@/components/PageTransition'

export async function generateMetadata({ params }: PageProps<'/[lang]/about'>): Promise<Metadata> {
  const lang = await langFrom(params)
  return pageMetadata(lang, '/about', dictionaries[lang].pages.about.meta)
}

export default async function AboutPage({ params }: PageProps<'/[lang]/about'>) {
  const lang = await langFrom(params)
  const { common, pages } = dictionaries[lang]
  const t = pages.about
  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-24 px-4 pt-28 sm:px-8 sm:pt-36">
        <header className="grid items-end gap-10 lg:grid-cols-[1.4fr_1fr]">
          <SectionHeading id="about-title" level={1} eyebrow={t.eyebrow} title={t.title} accent={t.accent}>
            <p className="max-w-xl text-xl leading-relaxed text-muted">{t.lead}</p>
          </SectionHeading>
          <div className="card p-6">
            <h2 className="font-display text-xl font-bold">{t.rules.title}</h2>
            <ul className="mt-4 space-y-3">
              {t.rules.items.map((rule, index) => (
                <li
                  key={rule.text}
                  className={`flex items-center gap-3 rounded-2xl bg-soft px-4 py-3 font-semibold ${
                    index % 2 ? 'rotate-1' : '-rotate-1'
                  }`}
                >
                  <span aria-hidden className="text-xl">
                    <Icon name={rule.icon} className="h-7 w-7" />
                  </span>
                  {rule.text}
                </li>
              ))}
            </ul>
          </div>
        </header>

        <section aria-labelledby="story-title" className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="max-w-prose space-y-5">
            <h2 id="story-title" className="font-display text-3xl font-extrabold">
              {t.story.title}
            </h2>
            {t.story.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-lg leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="card space-y-5 self-start p-6">
            <h2 className="font-display text-xl font-bold">{t.hours.title}</h2>
            <dl className="space-y-3">
              <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
                <dt className="text-muted">{t.hours.shop}</dt>
                <dd className="text-right">
                  <span className="font-display text-2xl font-extrabold tabular-nums">
                    {signTime(SHOP.hours.open)}–{signTime(SHOP.hours.close)}
                  </span>
                  <span className="block text-sm text-muted">{t.hours.everyDay}</span>
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
                <dt className="text-muted">{t.hours.delivery}</dt>
                <dd className="text-right">
                  <span className="font-display text-2xl font-extrabold tabular-nums">
                    {signTime(SHOP.deliveryHours.first)}–{signTime(SHOP.deliveryHours.last)}
                  </span>
                  <span className="block text-sm text-muted">{t.hours.everyDay}</span>
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">{t.hours.area}</dt>
                <dd className="text-right font-semibold">{SHOP.area[lang]}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section id="project" aria-labelledby="project-title" className="scroll-mt-28">
          <div className="sticker relative bg-butter-soft p-6 sm:p-10">
            <span className="chip absolute -top-3.5 left-6 -rotate-3 border border-ink/80 px-3 py-1 text-sm">
              <span aria-hidden>✦</span> {common.notice.badge}
            </span>
            <h2
              id="project-title"
              className="font-display text-[clamp(1.9rem,4vw,3rem)] leading-[1.08] font-extrabold tracking-tight"
            >
              {t.project.title}
              <span className="mark">{t.project.accent}</span>
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed">{t.project.body}</p>
            <h3 className="mt-8 font-display text-xl font-bold">{t.project.showsTitle}</h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {t.project.shows.map((item) => (
                <li key={item} className="flex gap-3 rounded-2xl bg-surface p-4 leading-relaxed">
                  <span aria-hidden className="font-display font-extrabold text-leaf">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <h3 className="mt-8 font-display text-xl font-bold">{t.project.stackLabel}</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {t.project.stack.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-ink/15 bg-surface px-3 py-1 text-sm font-semibold"
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-8 flex flex-wrap gap-3">
              <a href={SHOP.maker.url} rel="author" className="btn btn-buy">
                {t.project.maker}
              </a>
              <a href={SHOP.source} className="btn btn-ghost">
                {t.project.source}
              </a>
            </p>
          </div>
        </section>

        <section aria-labelledby="areas-title" className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 id="areas-title" className="font-display text-3xl font-extrabold">
              {t.areas.title}
            </h2>
            <p className="text-lg leading-relaxed">{t.areas.lead}</p>
            <DeliveryAreas />
            <p className="max-w-prose rounded-2xl bg-soft p-4 text-sm leading-relaxed text-muted">
              {t.areas.merger}
            </p>
          </div>
          <div id="contact" className="card scroll-mt-28 space-y-4 self-start p-6 sm:p-8">
            <h2 className="font-display text-3xl font-extrabold">{t.contact.title}</h2>
            <ContactLinks lang={lang} hotline={t.contact.hotline} />
            <p className="leading-relaxed text-muted">{t.contact.note}</p>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}
