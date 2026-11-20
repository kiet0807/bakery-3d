import type { Locale } from '@/i18n/config'
import { dictionaries } from '@/i18n/dictionaries'
import { LocalLink } from '@/i18n/LangProvider'
import { SHOP } from '@/lib/shop'
import { Logo, Wordmark } from './Logo'

/** The year the copyright line names. Fixed, so the footer can be prerendered with no clock. */
const YEAR = 2026

export function SiteFooter({ lang }: { lang: Locale }) {
  const { common } = dictionaries[lang]
  const f = common.footer
  const external = [
    { href: SHOP.zalo, label: 'Zalo' },
    { href: SHOP.social.facebook, label: 'Facebook' },
    { href: SHOP.social.instagram, label: 'Instagram' },
    { href: SHOP.social.tiktok, label: 'TikTok' },
  ]
  return (
    <footer aria-label={f.label} className="relative mx-auto mt-24 max-w-7xl px-4 pb-10 sm:px-8">
      <div className="sticker relative overflow-hidden p-6 sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="space-y-4">
            <p className="flex items-center gap-3">
              <Logo className="h-12 w-12" />
              <Wordmark lang={lang} />
              <span className="sr-only">{SHOP.name}</span>
            </p>
            <p className="max-w-sm leading-relaxed text-muted">{f.blurb}</p>
            <p id="demo-notice" className="max-w-sm rounded-2xl bg-butter-soft p-4 text-sm leading-relaxed">
              <span className="chip mb-2 -rotate-1">
                <span aria-hidden>✦</span> {common.notice.badge}
              </span>
              <br />
              {common.notice.text}
            </p>
          </div>

          <nav aria-label={f.explore} className="space-y-3">
            <p className="eyebrow">{f.explore}</p>
            <ul className="space-y-2">
              <li>
                <LocalLink className="hover:text-leaf hover:underline" href="/design">
                  {f.links.design}
                </LocalLink>
              </li>
              <li>
                <LocalLink className="hover:text-leaf hover:underline" href="/menu">
                  {f.links.menu}
                </LocalLink>
              </li>
              <li>
                <LocalLink className="hover:text-leaf hover:underline" href="/#story">
                  {f.links.story}
                </LocalLink>
              </li>
            </ul>
          </nav>

          <nav aria-label={f.help} className="space-y-3">
            <p className="eyebrow">{f.help}</p>
            <ul className="space-y-2">
              <li>
                <LocalLink className="hover:text-leaf hover:underline" href="/about">
                  {f.links.about}
                </LocalLink>
              </li>
              <li>
                <LocalLink className="hover:text-leaf hover:underline" href="/policies">
                  {f.links.policies}
                </LocalLink>
              </li>
              <li>
                <LocalLink className="hover:text-leaf hover:underline" href="/faq">
                  {f.links.faq}
                </LocalLink>
              </li>
            </ul>
          </nav>

          <div className="space-y-3">
            <p className="eyebrow">{f.contact}</p>
            <p>
              <span className="block text-sm text-muted">{f.hotline}</span>
              <a
                className="font-display text-2xl font-bold tabular-nums hover:text-leaf"
                href={`tel:${SHOP.phone.tel}`}
              >
                {SHOP.phone.display}
              </a>
            </p>
            <ul className="flex flex-wrap gap-2">
              {external.map((link) => (
                <li key={link.label}>
                  <a
                    className="inline-flex rounded-full border-2 border-ink/20 px-3 py-1 text-sm font-semibold transition-colors hover:border-ink hover:bg-soft"
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted">{f.contactNote}</p>
            <ul className="space-y-1 text-sm">
              <li>{f.hours}</li>
              <li>{f.delivery}</li>
              <li className="text-muted">{SHOP.area[lang]}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line pt-6 text-sm text-muted">
          <p>{f.rights(YEAR)}</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <a className="hover:text-leaf hover:underline" href={SHOP.maker.url} rel="author">
              {f.madeBy}
            </a>
            <a className="hover:text-leaf hover:underline" href={SHOP.source}>
              {f.source}
            </a>
          </p>
          <p className="w-full text-xs">{f.credits}</p>
        </div>
      </div>
    </footer>
  )
}
