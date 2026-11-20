import type { Metadata } from 'next'
import { ContactLinks } from '@/components/info/ContactLinks'
import { SectionHeading } from '@/components/info/SectionHeading'
import { dictionaries } from '@/i18n/dictionaries'
import { LocalLink } from '@/i18n/LangProvider'
import { langFrom, pageMetadata } from '@/i18n/metadata'

export async function generateMetadata({ params }: PageProps<'/[lang]/faq'>): Promise<Metadata> {
  const lang = await langFrom(params)
  return pageMetadata(lang, '/faq', dictionaries[lang].pages.faq.meta)
}

export default async function FaqPage({ params }: PageProps<'/[lang]/faq'>) {
  const lang = await langFrom(params)
  const t = dictionaries[lang].pages.faq
  return (
    <div className="mx-auto max-w-4xl px-4 pt-28 sm:px-8 sm:pt-36">
      <SectionHeading id="faq-title" level={1} eyebrow={t.eyebrow} title={t.title} accent={t.accent}>
        <p className="max-w-2xl text-xl leading-relaxed text-muted">{t.lead}</p>
      </SectionHeading>

      <ul className="mt-12 space-y-3">
        {t.items.map((item) => (
          <li key={item.q}>
            <details className="group card overflow-hidden open:shadow-sticker">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-display text-lg font-bold sm:p-6 sm:text-xl [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  aria-hidden
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-butter text-xl leading-none transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="space-y-3 px-5 pb-6 text-lg leading-relaxed sm:px-6">
                <p>{item.a}</p>
                {item.link && (
                  <p>
                    <LocalLink
                      href={item.link.href}
                      className="font-semibold text-leaf underline decoration-2 underline-offset-4 hover:decoration-butter"
                    >
                      {item.link.label}
                    </LocalLink>
                  </p>
                )}
              </div>
            </details>
          </li>
        ))}
      </ul>

      <section aria-labelledby="faq-more" className="sticker mt-16 space-y-4 bg-soft p-6 sm:p-8">
        <h2 id="faq-more" className="font-display text-3xl font-extrabold">
          {t.more.title}
        </h2>
        <p className="text-lg">{t.more.body}</p>
        <ContactLinks lang={lang} hotline={t.more.hotline} />
      </section>
    </div>
  )
}
