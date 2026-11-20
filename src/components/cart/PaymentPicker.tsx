'use client'

import { useDict, useLang } from '@/i18n/LangProvider'
import { money } from '@/lib/money'
import { DEPOSIT_SHARE, PAYMENTS, type Deposit } from '@/lib/order'
import type { CheckoutKit } from './checkoutKit'

/**
 * How to pay, as one row of three short choices (three stacked cards made the phone form long), the chosen one's
 * detail under it, and the deposit box. Cash is greyed out when the order takes a deposit, which is paid by
 * transfer or MoMo.
 */
export function PaymentPicker({ kit, deposit }: { kit: CheckoutKit; deposit: Deposit }) {
  const t = useDict().cart.checkout
  const lang = useLang()
  const { form, set, ids, prefix, errors, message, register } = kit
  const hasDeposit = deposit.amount > 0
  const noteOf = (payment: (typeof PAYMENTS)[number]) =>
    payment === 'cod' && hasDeposit ? t.payment.codWithDeposit : t.payment.notes[payment]
  // Under the row: what happens with the chosen way to pay, or why cash is greyed out.
  const detail = form.payment ? noteOf(form.payment) : hasDeposit ? t.payment.codWithDeposit : null
  const half = (deposit.amount + deposit.rest) * DEPOSIT_SHARE
  const reasons = deposit.reasons.map((reason) => t.deposit.reasons[reason]).join(', ')

  return (
    <fieldset className="space-y-2" aria-describedby={`${ids.payment}-deposit`}>
      <legend className="mb-2 font-display text-[0.95rem] font-bold">{t.payment.legend}</legend>
      <div className="grid grid-cols-3 gap-2">
        {PAYMENTS.map((payment, index) => {
          const disabled = payment === 'cod' && hasDeposit
          return (
            <label
              key={payment}
              className={`group relative block ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <input
                ref={index === (hasDeposit ? 1 : 0) ? register('payment') : undefined}
                type="radio"
                name={`${prefix}-payment`}
                value={payment}
                checked={form.payment === payment}
                disabled={disabled}
                onChange={() => set('payment', payment)}
                aria-describedby={errors.payment ? `${ids.payment}-error` : undefined}
                className="peer sr-only"
              />
              <span className="flex h-full min-h-13 items-center justify-center rounded-2xl border-2 border-edge bg-surface px-1.5 py-2 text-center font-display text-[0.9rem] leading-tight font-bold transition-[background-color,border-color,box-shadow] group-hover:border-ink peer-checked:border-ink peer-checked:bg-soft peer-checked:shadow-sticker peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-leaf peer-disabled:border-line peer-disabled:bg-cream peer-disabled:text-muted peer-disabled:line-through peer-disabled:shadow-none">
                <span>{t.payment.short[payment]}</span>
                <span className="sr-only">
                  {' '}
                  ({t.payment[payment]}): {noteOf(payment)}
                </span>
              </span>
            </label>
          )
        })}
      </div>
      {/* The same words are in each choice's name for screen readers; this line is for the eyes. */}
      {detail && (
        <p aria-hidden className="text-xs leading-snug text-muted">
          {detail}
        </p>
      )}
      {errors.payment && (
        <p id={`${ids.payment}-error`} className="text-sm font-medium text-error">
          {message('payment')}
        </p>
      )}
      <div id={`${ids.payment}-deposit`} className="rounded-2xl bg-butter-soft p-4 text-sm leading-relaxed">
        {hasDeposit ? (
          <>
            <p className="font-display font-bold">{t.deposit.title}</p>
            <p>{t.deposit.because(reasons)}</p>
            <dl className="mt-2 space-y-1">
              <div className="flex justify-between gap-4">
                <dt>{t.deposit.now}</dt>
                <dd className="font-semibold tabular-nums">{money(deposit.amount, lang)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>{t.deposit.later}</dt>
                <dd className="font-semibold tabular-nums">{money(deposit.rest, lang)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-muted">
              {half === deposit.amount
                ? t.deposit.exact
                : t.deposit.rounded(money(half, lang), money(deposit.amount, lang))}
            </p>
          </>
        ) : (
          <p>{t.deposit.none}</p>
        )}
      </div>
    </fieldset>
  )
}
