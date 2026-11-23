'use client'

import { useState } from 'react'
import { useDict, LocalLink } from '@/i18n/LangProvider'
import { countItems, subtotal } from '@/lib/cart'
import type { Order } from '@/lib/order'
import { CART_STORAGE_KEY, useCart } from '@/lib/store'
import { useCartHydrated } from '@/lib/useHydrated'
import { TickingMoney } from '../TickingMoney'
import { CartLine } from './CartLine'
import { Checkout } from './Checkout'
import { OrderDone, type PlacedOrder } from './OrderDone'

/**
 * Every state of the page is at least a screen tall, so the footer starts below the fold whatever the saved cart
 * turns out to hold: it never jumps in view when the skeleton gives way (a layout shift of 0.13 on a phone with an
 * empty cart, 0.12 on a desktop with a full one, before).
 */
const fullHeight = 'min-h-[100svh]'

const layout = `mx-auto grid max-w-7xl gap-8 px-4 pt-24 sm:px-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(360px,1fr)] lg:gap-12 lg:pt-32 ${fullHeight}`

/**
 * Reads the saved cart while the HTML is parsed, before the first paint, and marks the pending page "full" when
 * it holds cakes. It only reads: the store still loads the cart itself after hydration. Built from constants.
 */
const PENDING_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(CART_STORAGE_KEY)})||"null"),i=s&&s.state&&s.state.items;if(Array.isArray(i)&&i.length)document.currentScript.parentElement.setAttribute("data-cart","full")}catch(e){}})()`

/**
 * An inline script that runs on a full page load only: on the server it is JavaScript, in the browser plain text, so
 * React neither runs it again nor warns about it (node_modules/next/dist/docs/01-app/02-guides/
 * preventing-flash-before-hydration.md, "Extracting a reusable component").
 */
function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/**
 * The empty page, and before the saved cart is read (the server's HTML, the first render in the browser) also the
 * skeleton. Most visitors who open the cart page directly have nothing in it, so the empty page is what the server
 * sends: on screen at the first paint, no wait for the scripts. The inline script swaps it for the skeleton before
 * that paint when the saved cart holds cakes. Once the cart is read, an empty cart keeps these very elements (same
 * place in the tree, so React keeps the DOM: nothing is painted anew or moves); a full one replaces them.
 */
function EmptyOrPending({ pending }: { pending: boolean }) {
  return (
    <div data-cart="empty" suppressHydrationWarning className="group/pending">
      {pending && <InlineScript html={PENDING_SCRIPT} />}
      <div className={pending ? 'group-data-[cart=full]/pending:hidden' : undefined}>
        <EmptyCart />
      </div>
      {pending && (
        <div className="hidden group-data-[cart=full]/pending:block">
          <CartSkeleton />
        </div>
      )}
    </div>
  )
}

/** Shown for the moment it takes to read a saved cart with cakes in it, in the same shape as the cart. */
function CartSkeleton() {
  const { cart } = useDict()
  return (
    <div className={layout} aria-busy="true">
      <p className="sr-only" role="status">
        {cart.loading}
      </p>
      <div className="space-y-4" aria-hidden>
        <div className="h-4 w-28 animate-pulse rounded-full bg-cream-deep" />
        <div className="h-14 w-3/4 animate-pulse rounded-2xl bg-cream-deep" />
        <div className="h-40 animate-pulse rounded-3xl bg-surface" />
      </div>
      <div className="h-96 animate-pulse rounded-3xl bg-surface" aria-hidden />
    </div>
  )
}

function EmptyCart() {
  const { cart } = useDict()
  const t = cart.empty
  return (
    <section className={`mx-auto max-w-3xl px-4 pt-36 text-center sm:px-8 sm:pt-44 ${fullHeight}`}>
      <p className="eyebrow mb-4">{t.eyebrow}</p>
      <h1 className="font-display text-[clamp(2.6rem,6.5vw,4.6rem)] leading-[1.02] font-extrabold">
        {t.title} <span className="mark">{t.titleMark}</span>
      </h1>
      <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-muted">{t.body}</p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <LocalLink href="/design" className="btn btn-buy">
          {t.design}
        </LocalLink>
        <LocalLink href="/menu" className="btn btn-ghost">
          {t.menu}
        </LocalLink>
      </div>
    </section>
  )
}

export function CartView() {
  const { cart } = useDict()
  const hydrated = useCartHydrated()
  const items = useCart((state) => state.items)
  const [order, setOrder] = useState<PlacedOrder | null>(null)

  if (order) return <OrderDone order={order} />
  if (!hydrated || !items.length) return <EmptyOrPending pending={!hydrated} />

  const count = countItems(items)
  const total = subtotal(items)
  const t = cart.summary

  const placed = (placedOrder: Order) => {
    setOrder({ ...placedOrder, items })
    useCart.getState().clear()
    window.scrollTo({ top: 0 })
  }

  return (
    <div className={layout}>
      <div className="space-y-8">
        <header className="space-y-3">
          <p className="eyebrow">{cart.eyebrow}</p>
          <h1 className="font-display text-[clamp(2.4rem,5.4vw,4rem)] leading-[1.04] font-extrabold">
            {cart.title(count)} <span className="mark">{cart.titleMark}</span>
          </h1>
        </header>
        <ul className="space-y-4" aria-label={cart.linesLabel}>
          {items.map((item) => (
            <CartLine key={item.id} item={item} />
          ))}
        </ul>
        <LocalLink
          href="/design"
          className="inline-flex items-center gap-1.5 font-semibold text-leaf underline-offset-4 hover:underline"
        >
          <span aria-hidden>←</span> {cart.addAnother}
        </LocalLink>
      </div>

      {/* Not sticky: the form is taller than a screen, and a pinned column would hide the order button. */}
      <aside className="sticker space-y-6 self-start p-6 sm:p-7" aria-label={t.label}>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t.subtotal}</dt>
            <dd className="tabular-nums">
              <TickingMoney value={total} />
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t.shipping}</dt>
            <dd>{t.shippingValue}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t-2 border-dashed border-line pt-3">
            <dt className="font-display font-bold">{t.total}</dt>
            <dd className="font-display text-3xl font-extrabold tabular-nums">
              <TickingMoney value={total} />
            </dd>
          </div>
        </dl>
        <p className="text-xs leading-relaxed text-muted">{t.shipNote}</p>
        <Checkout items={items} total={total} onPlaced={placed} />
      </aside>
    </div>
  )
}
