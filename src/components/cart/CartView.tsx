'use client'

import Link from 'next/link'
import { useState } from 'react'
import { countItems, subtotal } from '@/lib/cart'
import { money } from '@/lib/money'
import type { Order } from '@/lib/order'
import { useCart } from '@/lib/store'
import { useCartHydrated } from '@/lib/useHydrated'
import { CartLine } from './CartLine'
import { Checkout } from './Checkout'
import { OrderDone, type PlacedOrder } from './OrderDone'

const layout =
  'mx-auto grid max-w-7xl gap-8 px-4 pt-24 sm:px-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)] lg:gap-12 lg:pt-32'

/** Shown for the moment it takes to read the saved cart, in the same shape as the cart. */
function CartSkeleton() {
  return (
    <div className={layout} aria-busy="true">
      <p className="sr-only" role="status">
        Loading your cart…
      </p>
      <div className="space-y-4" aria-hidden>
        <div className="h-4 w-24 animate-pulse rounded-full bg-white/10" />
        <div className="h-14 w-3/4 animate-pulse rounded-2xl bg-white/10" />
        <div className="h-40 animate-pulse rounded-3xl bg-white/[0.06]" />
      </div>
      <div className="h-96 animate-pulse rounded-3xl bg-white/[0.06]" aria-hidden />
    </div>
  )
}

function EmptyCart() {
  return (
    <section className="mx-auto max-w-3xl px-4 pt-36 text-center sm:px-8 sm:pt-44">
      <p className="eyebrow mb-4">Your cart</p>
      <h1 className="text-[clamp(2.4rem,6vw,4.2rem)] leading-[1.04] font-light tracking-tight">
        Nothing in the box <span className="text-accent">yet.</span>
      </h1>
      <p className="mx-auto mt-5 max-w-md leading-relaxed text-mist">
        Build a cake layer by layer, or pick one of the six house cakes from the vitrine.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link
          href="/design"
          className="inline-flex min-h-12 items-center rounded-full bg-ink px-6 font-semibold text-night transition-transform hover:-translate-y-0.5"
        >
          Build a cake
        </Link>
        <Link
          href="/menu"
          className="inline-flex min-h-12 items-center rounded-full border border-white/40 px-6 font-medium transition-colors hover:border-moon hover:text-moon"
        >
          Browse the vitrine
        </Link>
      </div>
    </section>
  )
}

export function CartView() {
  const hydrated = useCartHydrated()
  const items = useCart((state) => state.items)
  const [order, setOrder] = useState<PlacedOrder | null>(null)

  if (order) return <OrderDone order={order} />
  if (!hydrated) return <CartSkeleton />
  if (!items.length) return <EmptyCart />

  const count = countItems(items)
  const total = subtotal(items)

  const placed = (placedOrder: Order) => {
    setOrder({ ...placedOrder, items, total })
    useCart.getState().clear()
    window.scrollTo({ top: 0 })
  }

  return (
    <div className={layout}>
      <div className="space-y-8">
        <header className="space-y-3">
          <p className="eyebrow">Your cart</p>
          <h1 className="text-[clamp(2.4rem,5.4vw,4rem)] leading-[1.04] font-light tracking-tight">
            {count} {count === 1 ? 'cake' : 'cakes'}, <span className="text-accent">ready for the box.</span>
          </h1>
        </header>
        <ul className="space-y-4" aria-label="Cakes in your cart">
          {items.map((item) => (
            <CartLine key={item.id} item={item} />
          ))}
        </ul>
        <Link href="/design" className="inline-block text-sm text-moon underline-offset-4 hover:underline">
          ← Add another cake
        </Link>
      </div>

      <aside
        className="glass space-y-6 self-start rounded-3xl p-6 sm:p-7 lg:sticky lg:top-28"
        aria-label="Order"
      >
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-mist">Subtotal</dt>
            <dd className="tabular-nums">{money(total)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-mist">Pickup at the bakery</dt>
            <dd>Free</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-white/10 pt-3">
            <dt className="font-medium">Total</dt>
            <dd className="text-3xl font-light tabular-nums">{money(total)}</dd>
          </div>
        </dl>
        <Checkout total={total} onPlaced={placed} />
      </aside>
    </div>
  )
}
