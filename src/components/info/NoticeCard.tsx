import type { Locale } from '@/i18n/config'
import { dictionaries } from '@/i18n/dictionaries'
import { LocalLink } from '@/i18n/LangProvider'

/** The plain statement that the shop does not exist, as a sticker card. */
export function NoticeCard({
  lang,
  title,
  titleId,
  linkLabel,
  className = '',
}: {
  lang: Locale
  /** A heading for the card (an h2), so the notice can be found by heading like any other section. */
  title?: string
  titleId?: string
  /** When set, links to the project section of the about page. */
  linkLabel?: string
  className?: string
}) {
  const { common } = dictionaries[lang]
  return (
    <div className={`sticker relative bg-butter-soft p-6 sm:p-8 ${className}`}>
      <span className="chip absolute -top-3 left-6 -rotate-3 border border-ink/80 px-3 py-1 text-sm">
        <span aria-hidden>✦</span> {common.notice.badge}
      </span>
      {title && (
        <h2 id={titleId} className="mb-2 font-display text-2xl font-extrabold">
          {title}
        </h2>
      )}
      <p className="max-w-2xl text-lg leading-relaxed">{common.notice.text}</p>
      {linkLabel && (
        <p className="mt-4">
          <LocalLink
            href="/about#project"
            className="font-semibold text-leaf underline decoration-2 underline-offset-4 hover:decoration-butter"
          >
            {linkLabel}
          </LocalLink>
        </p>
      )}
    </div>
  )
}
