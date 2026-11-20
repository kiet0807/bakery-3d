'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { priceOf } from '@/lib/cake'
import { cakeName } from '@/i18n/cake-text'
import { useDict } from '@/i18n/LangProvider'
import type { CartItem } from '@/lib/cart'
import { money } from '@/lib/money'
import { formatPickupDay, type Order } from '@/lib/order'
import { ScenePoster } from '../ScenePoster'

const BoxScene = dynamic(() => import('../three/scenes/BoxScene'), {
  ssr: false,
  loading: () => <ScenePoster label="Folding the box…" />,
})

export interface PlacedOrder extends Order {
  items: CartItem[]
  total: number
}

/** The end of the demo: the first cake boxed up in 3D, and a receipt that says plainly nothing was charged. */
export function OrderDone({ order }: { order: PlacedOrder }) {
  const dict = useDict()
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const { form } = order

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 pt-20 sm:px-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(340px,1fr)] lg:gap-12 lg:pt-28">
      <div className="h-[52svh] min-h-80 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] lg:sticky lg:top-28 lg:h-[calc(100svh-9rem)]">
        <BoxScene config={order.items[0].config} />
      </div>
      <div className="space-y-8 self-center pb-10">
        <header className="space-y-3">
          <p className="eyebrow">Order {order.number}</p>
          <h1
            ref={heading}
            tabIndex={-1}
            className="text-[clamp(2.6rem,6vw,4.5rem)] leading-[1.02] font-light tracking-tight outline-none"
          >
            Boxed and <span className="text-accent">ready.</span>
          </h1>
          <p className="leading-relaxed text-mist">
            {count === 1 ? 'Your cake is' : `Your ${count} cakes are`} waiting for {form.name} on{' '}
            <span className="text-ink">{formatPickupDay(form.date)}</span> at{' '}
            <span className="text-ink tabular-nums">{form.time}</span>.
          </p>
        </header>

        <section aria-labelledby="receipt-title" className="glass space-y-4 rounded-3xl p-6">
          <h2 id="receipt-title" className="eyebrow">
            Receipt
          </h2>
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span>
                  {cakeName(item.presetId, dict)}{' '}
                  <span className="text-mist tabular-nums">× {item.quantity}</span>
                </span>
                <span className="tabular-nums">{money(priceOf(item.config) * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between gap-4 border-t border-white/10 pt-3 font-medium">
            <span>Total</span>
            <span className="tabular-nums">{money(order.total)}</span>
          </div>
          {form.note && (
            <p className="text-sm text-mist">
              <span className="text-ink">Note:</span> {form.note}
            </p>
          )}
        </section>

        <p className="rounded-2xl border border-moon/30 bg-moon/10 p-4 text-sm leading-relaxed">
          This was a demo: nothing was sent and nothing was charged.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/design"
            className="inline-flex min-h-12 items-center rounded-full bg-ink px-6 font-semibold text-night transition-transform hover:-translate-y-0.5"
          >
            Build another cake
          </Link>
          <Link
            href="/menu"
            className="inline-flex min-h-12 items-center rounded-full border border-white/40 px-6 font-medium transition-colors hover:border-moon hover:text-moon"
          >
            Back to the vitrine
          </Link>
        </div>
      </div>
    </div>
  )
}
