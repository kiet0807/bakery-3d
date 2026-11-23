'use client'

import { useDict } from '@/i18n/LangProvider'
import { MAX_ADDRESS_LENGTH, MAX_NAME_LENGTH, METHODS, type Method } from '@/lib/order'
import { DELIVERY_AREAS } from '@/lib/shop'
import type { CheckoutKit } from './checkoutKit'
import { Field, OptionCard } from './FormParts'

/** Step 1: who the order is for, and pickup or delivery (with the address). */
export function StepWho({ kit, onMethod }: { kit: CheckoutKit; onMethod: (method: Method) => void }) {
  const t = useDict().cart.checkout
  const { form, set, ids, prefix, errors, message, describedBy, register } = kit

  return (
    <>
      <Field id={ids.name} label={t.name.label} hint={t.name.hint} error={message('name')}>
        <input
          ref={register('name')}
          id={ids.name}
          type="text"
          autoComplete="name"
          maxLength={MAX_NAME_LENGTH}
          value={form.name}
          onChange={(event) => set('name', event.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describedBy('name')}
          placeholder={t.name.placeholder}
          className="field"
        />
      </Field>

      <Field id={ids.phone} label={t.phone.label} hint={t.phone.hint} error={message('phone')}>
        <input
          ref={register('phone')}
          id={ids.phone}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          value={form.phone}
          onChange={(event) => set('phone', event.target.value)}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={describedBy('phone')}
          placeholder={t.phone.placeholder}
          className="field tabular-nums"
        />
      </Field>

      <fieldset className="space-y-2" aria-describedby={errors.method ? `${ids.method}-error` : undefined}>
        <legend className="mb-2 font-display text-[0.95rem] font-bold">{t.method.legend}</legend>
        <div className="grid grid-cols-2 gap-2">
          {METHODS.map((method, index) => (
            <OptionCard
              key={method}
              name={`${prefix}-method`}
              value={method}
              checked={form.method === method}
              onChange={() => onMethod(method)}
              inputRef={index === 0 ? register('method') : undefined}
              title={t.method[method]}
              note={t.method.notes[method]}
            />
          ))}
        </div>
        {errors.method && (
          <p id={`${ids.method}-error`} className="text-sm font-medium text-error">
            {message('method')}
          </p>
        )}
      </fieldset>

      {form.method === 'delivery' && (
        <div className="space-y-4 rounded-2xl bg-soft p-4">
          <Field id={ids.address} label={t.address.label} hint={t.address.hint} error={message('address')}>
            <input
              ref={register('address')}
              id={ids.address}
              type="text"
              autoComplete="street-address"
              maxLength={MAX_ADDRESS_LENGTH}
              value={form.address}
              onChange={(event) => set('address', event.target.value)}
              aria-invalid={Boolean(errors.address)}
              aria-describedby={describedBy('address')}
              placeholder={t.address.placeholder}
              className="field"
            />
          </Field>
          <div className="space-y-1.5 text-sm leading-relaxed">
            <p className="font-display font-bold">{t.delivery.title}</p>
            <p className="text-muted">
              {t.delivery.areas}: <span lang="vi">{DELIVERY_AREAS.join(', ')}</span>.
            </p>
            <p>{t.delivery.fee}</p>
            <p className="text-muted">{t.delivery.car}</p>
          </div>
        </div>
      )}
    </>
  )
}
