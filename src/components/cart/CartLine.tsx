'use client'

import { priceOf } from '@/lib/cake'
import { cakeName, describeCake } from '@/i18n/cake-text'
import { useDict } from '@/i18n/LangProvider'
import { MAX_QUANTITY, type CartItem } from '@/lib/cart'
import { money } from '@/lib/money'
import { useCart } from '@/lib/store'
import { CakeThumb } from './CakeThumb'

const stepper =
  'grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-xl font-semibold transition-colors hover:border-white/35 disabled:opacity-40 disabled:hover:border-white/15'

/** One line of the cart: picture, description, quantity and price. */
export function CartLine({ item }: { item: CartItem }) {
  const setQuantity = useCart((state) => state.setQuantity)
  const remove = useCart((state) => state.remove)
  const dict = useDict()
  const name = cakeName(item.presetId, dict)
  const each = priceOf(item.config)
  return (
    <li className="glass flex gap-4 rounded-3xl p-4 sm:p-5">
      <CakeThumb config={item.config} snapshot={item.snapshot} className="h-16 w-16 sm:h-24 sm:w-24" />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-light sm:text-2xl">{name}</h2>
            <p className="mt-1 text-sm leading-relaxed text-mist">{describeCake(item.config, dict)}</p>
          </div>
          <p className="shrink-0 text-lg font-light tabular-nums sm:text-xl">{money(each * item.quantity)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2" role="group" aria-label={`Quantity of ${name}`}>
            <button
              type="button"
              className={stepper}
              onClick={() => setQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              aria-label={`One fewer ${name}`}
            >
              −
            </button>
            <output aria-live="polite" className="min-w-10 text-center text-xl font-light tabular-nums">
              {item.quantity}
            </output>
            <button
              type="button"
              className={stepper}
              onClick={() => setQuantity(item.id, item.quantity + 1)}
              disabled={item.quantity >= MAX_QUANTITY}
              aria-label={`One more ${name}`}
            >
              +
            </button>
          </div>
          {item.quantity > 1 && <p className="text-xs text-haze tabular-nums">{money(each)} each</p>}
          <button
            type="button"
            onClick={() => remove(item.id)}
            className="ml-auto min-h-11 rounded-full px-3 text-sm font-medium text-mist underline-offset-4 hover:text-ink hover:underline"
          >
            Remove<span className="sr-only"> {name}</span>
          </button>
        </div>
      </div>
    </li>
  )
}
