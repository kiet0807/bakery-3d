'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef } from 'react'
import { cakeName } from '@/i18n/cake-text'
import { LocalLink, useDict, useLang } from '@/i18n/LangProvider'
import { priceOf } from '@/lib/cake'
import type { CartItem } from '@/lib/cart'
import { money } from '@/lib/money'
import { formatDay, formatPhone, type Order } from '@/lib/order'
import { ORDERING_OPEN } from '@/lib/shop'
import { ScenePoster } from '../ScenePoster'

function BoxLoading() {
  const { cart } = useDict()
  return <ScenePoster label={cart.done.boxLoading} />
}

const BoxScene = dynamic(() => import('../three/scenes/BoxScene'), {
  ssr: false,
  loading: () => <BoxLoading />,
})

export interface PlacedOrder extends Order {
  items: CartItem[]
}

/** The end of checkout: the first cake boxed up in 3D, and a receipt that says plainly nothing was charged. */
export function OrderDone({ order }: { order: PlacedOrder }) {
  const dict = useDict()
  const lang = useLang()
  const t = dict.cart.done
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const { form, deposit } = order

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 pt-20 sm:px-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(340px,1fr)] lg:gap-12 lg:pt-28">
      <div className="sticker h-[52svh] min-h-80 overflow-hidden bg-soft lg:sticky lg:top-28 lg:h-[calc(100svh-9rem)]">
        <BoxScene config={order.items[0].config} />
      </div>
      <div className="space-y-8 self-center pb-10">
        <header className="space-y-3">
          <p className="eyebrow">{t.eyebrow(order.number)}</p>
          <h1
            ref={heading}
            tabIndex={-1}
            className="font-display text-[clamp(2.6rem,6vw,4.4rem)] leading-[1.02] font-extrabold outline-none"
          >
            {t.title} <span className="mark">{t.titleMark[form.method]}</span>
          </h1>
          <p className="text-lg leading-relaxed text-muted">
            {t.waiting(count, form.name)}{' '}
            <strong className="font-semibold text-ink tabular-nums">{form.time}</strong>,{' '}
            <strong className="font-semibold text-ink">{formatDay(form.date, lang)}</strong>.
          </p>
          <p className="leading-relaxed">
            {form.method === 'delivery' ? t.deliveryWhere(form.address) : t.pickupWhere}
          </p>
        </header>

        <section aria-labelledby="receipt-title" className="card space-y-4 p-6">
          <h2 id="receipt-title" className="eyebrow">
            {t.receipt}
          </h2>
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span>
                  {cakeName(item.presetId, dict)}{' '}
                  <span className="text-muted tabular-nums">× {item.quantity}</span>
                </span>
                <span className="tabular-nums">{money(priceOf(item.config) * item.quantity, lang)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1.5 border-t-2 border-dashed border-line pt-3">
            <div className="flex justify-between gap-4 font-display text-lg font-bold">
              <dt>{t.total}</dt>
              <dd className="tabular-nums">{money(order.total, lang)}</dd>
            </div>
            {deposit.amount > 0 && (
              <>
                <div className="flex justify-between gap-4 text-sm">
                  <dt className="text-muted">{t.deposit}</dt>
                  <dd className="tabular-nums">{money(deposit.amount, lang)}</dd>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <dt className="text-muted">{t.rest}</dt>
                  <dd className="tabular-nums">{money(deposit.rest, lang)}</dd>
                </div>
              </>
            )}
            {form.payment && (
              <div className="flex justify-between gap-4 text-sm">
                <dt className="text-muted">{t.payment}</dt>
                <dd>{dict.cart.checkout.payment[form.payment]}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-muted">{t.phone}</dt>
              <dd className="tabular-nums">{formatPhone(form.phone)}</dd>
            </div>
          </dl>
          {form.method === 'delivery' && <p className="text-sm text-muted">{t.shipping}</p>}
          {form.note && (
            <p className="text-sm text-muted">
              <span className="font-semibold text-ink">{t.note}:</span> {form.note}
            </p>
          )}
        </section>

        <p className="flex gap-3 rounded-2xl border-2 border-dashed border-ink bg-peach-soft p-4 text-sm leading-relaxed">
          <span aria-hidden className="text-lg leading-none">
            ✦
          </span>
          <span>{ORDERING_OPEN ? t.sent : t.demo}</span>
        </p>

        <div className="flex flex-wrap gap-3">
          <LocalLink href="/design" className="btn btn-buy">
            {t.design}
          </LocalLink>
          <LocalLink href="/menu" className="btn btn-ghost">
            {t.menu}
          </LocalLink>
        </div>
      </div>
    </div>
  )
}
