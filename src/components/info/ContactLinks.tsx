import { SHOP } from '@/lib/shop'

/** The shop's phone number and its social links, as they are shared publicly. */
export function ContactLinks({ hotline, className = '' }: { hotline: string; className?: string }) {
  const links = [
    { href: SHOP.zalo, label: 'Zalo' },
    { href: SHOP.social.facebook, label: 'Facebook' },
    { href: SHOP.social.instagram, label: 'Instagram' },
    { href: SHOP.social.tiktok, label: 'TikTok' },
  ]
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
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full border-2 border-ink/20 bg-surface px-3.5 py-1.5 text-sm font-semibold transition-colors hover:border-ink hover:bg-soft"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
