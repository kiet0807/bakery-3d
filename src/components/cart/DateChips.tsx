'use client'

import { useEffect, useRef, useState } from 'react'
import type { Locale } from '@/i18n/config'
import { useDict, useLang } from '@/i18n/LangProvider'
import { addShopDays, formatDay, isHoliday } from '@/lib/order'
import type { CheckoutKit } from './checkoutKit'
import { FieldNotes } from './FormParts'

/** "21/11" in Vietnamese, "21 Nov" in English, for a shop date (YYYY-MM-DD). */
function dayMonth(date: string, lang: Locale) {
  const [, month, day] = date.split('-').map(Number)
  if (lang === 'vi') return `${day}/${month}`
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  )
}

const weekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay()

const chipFace =
  'flex h-full min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-edge bg-surface px-1 py-2 text-center transition-[background-color,border-color,box-shadow] group-hover:border-ink peer-checked:border-ink peer-checked:bg-soft peer-checked:shadow-sticker peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-leaf'

/**
 * The day of the order: the next seven days the shop can still bake for, as one radio group (arrow keys move
 * between them), and "Other day" for anything later, which brings out the browser's own date picker.
 */
export function DateChips({
  kit,
  choices,
  today,
  earliest,
  max,
  onDate,
}: {
  kit: CheckoutKit
  /** Days with an open slot, earliest first. */
  choices: string[]
  /** The shop's today, for "Today" and "Tomorrow". */
  today: string | null
  earliest: string | null
  max: string | undefined
  onDate: (date: string) => void
}) {
  const t = useDict().cart.checkout.date
  const lang = useLang()
  const { form, ids, prefix, errors } = kit
  const [otherChosen, setOtherChosen] = useState(false)
  // A day that is not one of the chips (typed earlier, or a chip that closed as time passed) shows in the
  // date field, so the visitor sees what the error under it is about.
  const other = otherChosen || (form.date !== '' && !choices.includes(form.date))
  const picker = useRef<HTMLInputElement | null>(null)
  const openedByClick = useRef(false)

  useEffect(() => {
    if (!other || !openedByClick.current) return
    openedByClick.current = false
    picker.current?.focus()
  }, [other])

  const pick = (date: string) => {
    setOtherChosen(false)
    onDate(date)
  }
  const pickOther = () => {
    openedByClick.current = true
    setOtherChosen(true)
    // "Other day" means another day: a chip's day does not carry over into the empty picker.
    if (choices.includes(form.date)) onDate('')
  }

  // The element an error on the date focuses: the picker when it is out, else the chosen chip or the first one.
  const register = kit.register('date')
  const focusIndex = other ? -1 : Math.max(0, choices.indexOf(form.date))
  const hint = earliest ? t.earliest(formatDay(earliest, lang)) : today ? t.none : undefined
  const describedBy =
    [errors.date && `${ids.date}-error`, hint && `${ids.date}-hint`].filter(Boolean).join(' ') || undefined
  const anyHoliday = choices.some(isHoliday)
  const tomorrow = today ? addShopDays(today, 1) : null

  return (
    <fieldset className="space-y-2" aria-describedby={describedBy}>
      <legend className="mb-2 font-display text-[0.95rem] font-bold">{t.label}</legend>
      <div className="grid grid-cols-4 gap-2">
        {choices.map((date, index) => {
          const holiday = isHoliday(date)
          const relative = date === today ? t.today : date === tomorrow ? t.tomorrow : null
          const full = [relative, formatDay(date, lang), holiday && t.holidayFull].filter(Boolean).join(', ')
          return (
            <label key={date} className="group relative block cursor-pointer">
              <input
                ref={index === focusIndex ? register : undefined}
                type="radio"
                name={`${prefix}-date`}
                value={date}
                checked={!other && form.date === date}
                onChange={() => pick(date)}
                className="peer sr-only"
              />
              <span className={chipFace}>
                <span aria-hidden className="text-xs leading-tight font-semibold text-muted">
                  {relative ?? t.weekdays[weekday(date)]}
                </span>
                <span
                  aria-hidden
                  className="font-display text-[0.95rem] leading-tight font-bold whitespace-nowrap tabular-nums min-[400px]:text-lg"
                >
                  {dayMonth(date, lang)}
                </span>
                <span className="sr-only">{full}</span>
              </span>
              {holiday && (
                <span
                  aria-hidden
                  className="chip absolute -top-2 -right-1 rotate-6 border border-ink px-1.5 py-0 text-[0.65rem]"
                >
                  {t.holiday}
                </span>
              )}
            </label>
          )
        })}
        <label className="group relative block cursor-pointer">
          <input
            ref={!other && choices.length === 0 ? register : undefined}
            type="radio"
            name={`${prefix}-date`}
            value="other"
            checked={other}
            onChange={pickOther}
            className="peer sr-only"
          />
          <span className={chipFace}>
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
              <path d="M3.5 10h17M8 3v4M16 3v4" strokeLinecap="round" />
            </svg>
            <span className="text-xs leading-tight font-semibold">{t.other}</span>
          </span>
        </label>
      </div>
      {other && (
        <div className="space-y-1.5 pt-1">
          <label htmlFor={ids.date} className="block text-sm font-semibold">
            {t.otherLabel}
          </label>
          <input
            ref={(node) => {
              picker.current = node
              register(node)
            }}
            id={ids.date}
            type="date"
            min={earliest ?? today ?? undefined}
            max={max}
            value={form.date}
            onChange={(event) => onDate(event.target.value)}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={describedBy}
            className="field min-h-12"
          />
        </div>
      )}
      <FieldNotes id={ids.date} error={kit.message('date')} hint={hint} />
      {anyHoliday && <p className="text-xs leading-relaxed text-muted">{t.holidayNote}</p>}
    </fieldset>
  )
}
