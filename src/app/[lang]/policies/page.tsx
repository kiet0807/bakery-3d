import type { Metadata } from 'next'
import { DeliveryAreas } from '@/components/info/DeliveryAreas'
import { SectionHeading } from '@/components/info/SectionHeading'
import { dictionaries } from '@/i18n/dictionaries'
import { langFrom, pageMetadata } from '@/i18n/metadata'
import type { PolicyBlock, PolicyId } from '@/i18n/vi/pages'
import { PageTransition } from '@/components/PageTransition'

const ORDER: PolicyId[] = ['delivery', 'payment', 'changes', 'damage', 'storage', 'allergens', 'privacy']

export async function generateMetadata({ params }: PageProps<'/[lang]/policies'>): Promise<Metadata> {
  const lang = await langFrom(params)
  return pageMetadata(lang, '/policies', dictionaries[lang].pages.policies.meta)
}

function Block({ block }: { block: PolicyBlock }) {
  return (
    <div className="space-y-3">
      {block.heading && <h3 className="font-display text-xl font-bold">{block.heading}</h3>}
      {block.table && (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full text-left text-[0.95rem]">
            <thead className="bg-soft font-display">
              <tr>
                {block.table.head.map((cell) => (
                  <th key={cell} scope="col" className="px-4 py-3 font-bold">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.table.rows.map(([kind, time]) => (
                <tr key={kind} className="border-t border-line">
                  <th scope="row" className="px-4 py-3 font-normal">
                    {kind}
                  </th>
                  <td className="px-4 py-3 font-semibold">{time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {block.text && <p className="leading-relaxed">{block.text}</p>}
      {block.items && (
        <ul className="space-y-2">
          {block.items.map((item) => (
            <li key={item} className="flex gap-3 leading-relaxed">
              <span aria-hidden className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-leaf" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
      {block.areas && <DeliveryAreas />}
    </div>
  )
}

export default async function PoliciesPage({ params }: PageProps<'/[lang]/policies'>) {
  const lang = await langFrom(params)
  const { common, pages } = dictionaries[lang]
  const t = pages.policies
  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl px-4 pt-28 sm:px-8 sm:pt-36">
        <header className="max-w-3xl space-y-6">
          <SectionHeading id="policies-title" level={1} eyebrow={t.eyebrow} title={t.title} accent={t.accent}>
            <p className="text-xl leading-relaxed text-muted">{t.lead}</p>
          </SectionHeading>
          <p className="rounded-2xl bg-butter-soft p-4 leading-relaxed">
            <span className="chip mr-2 -rotate-2 border border-ink/80">
              <span aria-hidden>✦</span> {common.notice.badge}
            </span>
            {t.demoNote}
          </p>
        </header>

        <div className="mt-14 grid gap-12 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <nav aria-label={t.tocLabel} className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow mb-3">{t.tocLabel}</p>
            <ol className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
              {ORDER.map((id, index) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="flex gap-2 rounded-xl px-3 py-2 font-semibold transition-colors hover:bg-soft hover:text-leaf"
                  >
                    <span aria-hidden className="font-display text-muted tabular-nums">
                      {index + 1}.
                    </span>
                    {t.sections[id].title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="max-w-3xl space-y-14">
            {ORDER.map((id) => {
              const section = t.sections[id]
              return (
                <section key={id} id={id} aria-labelledby={`${id}-title`} className="scroll-mt-28 space-y-6">
                  <div className="space-y-2 border-b-2 border-dashed border-line pb-4">
                    <h2 id={`${id}-title`} className="font-display text-3xl font-extrabold tracking-tight">
                      {section.title}
                    </h2>
                    <p className="text-lg font-semibold text-leaf">{section.summary}</p>
                  </div>
                  {section.blocks.map((block, index) => (
                    <Block key={index} block={block} />
                  ))}
                  {id === 'allergens' && (
                    <p className="rounded-2xl bg-soft p-4 text-sm leading-relaxed">{t.allergenHint}</p>
                  )}
                </section>
              )
            })}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
