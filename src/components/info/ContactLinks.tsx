import type { Locale } from '@/i18n/config'
import { dictionaries } from '@/i18n/dictionaries'
import { SHOP, SHOP_LINKS } from '@/lib/shop'

/** The shop's phone number and its social links, as they are shared publicly. */
export function ContactLinks({
  lang,
  hotline,
  className = '',
}: {
  lang: Locale
  hotline: string
  className?: string
}) {
  const { common } = dictionaries[lang]
  return (
    <div className={`space-y-3 ${className}`}>
      <p>
        <span className="block text-sm text-muted">{hotline}</span>
        <a
          href={`tel:${SHOP.phone.tel}`}
          className="font-display text-3xl font-extrabold tabular-nums hover:text-leaf"
        >
          {SHOP.phone.display}
        </a>
      </p>
      <ul className="flex flex-wrap gap-2">
        {SHOP_LINKS.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full border-2 border-ink/20 bg-surface px-3.5 py-1.5 text-sm font-semibold transition-colors hover:border-ink hover:bg-soft"
            >
              {link.label}
              <span className="sr-only"> {common.newTab}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
