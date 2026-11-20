'use client'

import { allergenText, cakeName, describeCake } from '@/i18n/cake-text'
import { useDict, useLang } from '@/i18n/LangProvider'
import { priceOf } from '@/lib/cake'
import { MAX_QUANTITY, type CartItem } from '@/lib/cart'
import { leadKind } from '@/lib/leadTime'
import { money } from '@/lib/money'
import { useCart } from '@/lib/store'
import { CakeThumb } from './CakeThumb'

const stepper =
  'grid h-11 w-11 place-items-center rounded-full border-2 border-ink bg-surface font-display text-xl font-bold transition-colors hover:bg-butter-soft disabled:cursor-not-allowed disabled:border-edge disabled:text-muted disabled:hover:bg-surface'

/** One line of the cart: picture, description, allergens, notice needed, quantity and price. */
export function CartLine({ item }: { item: CartItem }) {
  const setQuantity = useCart((state) => state.setQuantity)
  const remove = useCart((state) => state.remove)
  const dict = useDict()
  const lang = useLang()
  const t = dict.cart.line
  const name = cakeName(item.presetId, dict)
  const each = priceOf(item.config)
  const lead = leadKind(item.config, item.presetId)
  return (
    <li className="card grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 p-4 sm:p-5">
      <CakeThumb
        config={item.config}
        snapshot={item.snapshot}
        className="h-16 w-16 sm:row-span-3 sm:h-24 sm:w-24"
      />
      <div className="flex min-w-0 flex-col justify-between gap-1 sm:flex-row sm:items-start sm:gap-4">
        <h2 className="font-display text-xl leading-tight font-bold sm:text-2xl">{name}</h2>
        <p className="shrink-0 font-display text-lg font-bold tabular-nums sm:text-xl">
          {money(each * item.quantity, lang)}
        </p>
      </div>
      <div className="col-span-2 min-w-0 space-y-1.5 sm:col-span-1">
        <p className="text-sm leading-relaxed text-muted">{describeCake(item.config, dict)}</p>
        <p className="text-xs leading-relaxed text-muted">{allergenText(item.config, dict)}</p>
        <p>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-ink ${
              lead === 'menu' ? 'bg-soft' : 'bg-peach-soft'
            }`}
          >
            <span aria-hidden>⏱</span> {t.lead[lead]}
          </span>
        </p>
      </div>
      <div className="col-span-2 flex flex-wrap items-center gap-3 sm:col-span-1">
        <div className="flex items-center gap-2" role="group" aria-label={t.quantity(name)}>
          <button
            type="button"
            className={stepper}
            onClick={() => setQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
            aria-label={t.fewer(name)}
          >
            −
          </button>
          <output
            aria-live="polite"
            className="min-w-10 text-center font-display text-xl font-bold tabular-nums"
          >
            {item.quantity}
          </output>
          <button
            type="button"
            className={stepper}
            onClick={() => setQuantity(item.id, item.quantity + 1)}
            disabled={item.quantity >= MAX_QUANTITY}
            aria-label={t.more(name)}
          >
            +
          </button>
        </div>
        {item.quantity > 1 && <p className="text-xs text-muted tabular-nums">{t.each(money(each, lang))}</p>}
        <button
          type="button"
          onClick={() => remove(item.id)}
          className="ml-auto min-h-11 rounded-full px-3 text-sm font-semibold text-muted underline-offset-4 hover:text-error hover:underline"
        >
          {t.remove}
          <span className="sr-only"> {name}</span>
        </button>
      </div>
    </li>
  )
}
