'use client'

import { useEffect, useRef, useState } from 'react'
import { useDict } from '@/i18n/LangProvider'
import type { CartItem } from '@/lib/cart'
import {
  MAX_NOTE_LENGTH,
  dateChoices,
  dateRange,
  depositFor,
  formatPhone,
  leadFor,
  normalizePhone,
  shopToday,
  slotsFor,
} from '@/lib/order'
import type { CheckoutKit } from './checkoutKit'
import { DateChips } from './DateChips'
import { Field } from './FormParts'
import { PaymentPicker } from './PaymentPicker'

/** How many days the quick picks show; later days go through "Other day". */
const QUICK_DAYS = 7

/** Step 2: what step 1 said (with a way back), then the day, the time, the payment and a note. */
export function StepWhen({
  kit,
  items,
  now,
  onDate,
  onEdit,
}: {
  kit: CheckoutKit
  items: CartItem[]
  /** The current minute, or null before the page knows the time. */
  now: Date | null
  onDate: (date: string) => void
  onEdit: () => void
}) {
  const t = useDict().cart.checkout
  const { form, set, ids, errors, message, describedBy, register } = kit
  // The note is optional, so its box opens on request (it stays open once something is in it).
  const [noteOpen, setNoteOpen] = useState(form.note !== '')
  const noteBox = useRef<HTMLTextAreaElement | null>(null)
  const openedNote = useRef(false)
  useEffect(() => {
    if (!noteOpen || !openedNote.current) return
    openedNote.current = false
    noteBox.current?.focus()
  }, [noteOpen])

  const context = now ? { now, method: form.method, items } : null
  const range = now ? dateRange(now) : null
  const choices = context ? dateChoices(context, QUICK_DAYS) : []
  // The first quick pick is the earliest day (none when the whole 30-day window is full).
  const earliest = choices[0] ?? null
  const slots = context && form.date ? slotsFor(form.date, context) : []
  const lead = leadFor(items, form.date || undefined)
  const deposit = depositFor(items, form.date || undefined)

  return (
    <>
      <div className="flex items-start justify-between gap-3 rounded-2xl border-2 border-dashed border-line px-4 py-3 text-sm">
        <div className="min-w-0 space-y-0.5">
          <p className="sr-only">{t.steps.summary}</p>
          <p className="font-semibold break-words">
            {form.name.trim()}
            <span aria-hidden> · </span>
            <span className="sr-only">, </span>
            <span className="tabular-nums">
              {formatPhone(normalizePhone(form.phone) ?? form.phone.trim())}
            </span>
          </p>
          <p className="break-words text-muted">
            {form.method === 'delivery' ? t.steps.deliverTo(form.address.trim()) : t.steps.pickup}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={t.steps.editLabel}
          className="shrink-0 rounded-full px-2 py-1 font-semibold text-leaf underline-offset-4 hover:underline"
        >
          {t.steps.edit}
        </button>
      </div>

      <div className="space-y-2">
        <p className="flex flex-wrap gap-2">
          <span className="inline-flex -rotate-1 items-center gap-1.5 rounded-full border-2 border-ink bg-butter px-3 py-1 text-sm font-semibold">
            <span aria-hidden>⏱</span> {lead.holiday ? t.holidayLead : t.lead[lead.kind]}
          </span>
        </p>
        {lead.kind === 'menu' && !lead.holiday && <p className="text-xs text-muted">{t.sameDay}</p>}
      </div>

      <DateChips
        kit={kit}
        choices={choices}
        today={now ? shopToday(now) : null}
        earliest={earliest}
        max={range?.max}
        onDate={onDate}
      />

      <Field
        id={ids.time}
        label={t.time.label}
        hint={form.date && !slots.length ? t.time.none : undefined}
        error={message('time')}
      >
        <select
          ref={register('time')}
          id={ids.time}
          value={form.time}
          onChange={(event) => set('time', event.target.value)}
          aria-invalid={Boolean(errors.time)}
          aria-describedby={describedBy('time', Boolean(form.date && !slots.length))}
          className="field min-h-12"
        >
          <option value="">{form.date ? t.time.choose : t.time.pickDate}</option>
          {slots.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
          {form.time && !slots.includes(form.time) && (
            <option value={form.time} disabled>
              {form.time}
            </option>
          )}
        </select>
      </Field>

      <PaymentPicker kit={kit} deposit={deposit} />

      {noteOpen || errors.note ? (
        <Field
          id={ids.note}
          label={t.note.label}
          hint={
            <span className="tabular-nums">
              {form.note.length}/{MAX_NOTE_LENGTH}
            </span>
          }
          error={message('note')}
        >
          <textarea
            ref={(node) => {
              noteBox.current = node
              register('note')(node)
            }}
            id={ids.note}
            rows={3}
            maxLength={MAX_NOTE_LENGTH}
            value={form.note}
            onChange={(event) => set('note', event.target.value)}
            aria-invalid={Boolean(errors.note)}
            aria-describedby={describedBy('note')}
            placeholder={t.note.placeholder}
            className="field resize-y"
          />
        </Field>
      ) : (
        <button
          type="button"
          onClick={() => {
            openedNote.current = true
            setNoteOpen(true)
          }}
          className="inline-flex items-start gap-1.5 rounded-full px-1 py-1 text-left text-sm font-semibold text-leaf underline-offset-4 hover:underline"
        >
          <span aria-hidden>＋</span> {t.note.add}
        </button>
      )}
    </>
  )
}
