import type { ReactNode } from 'react'

/** A labelled field with its error and hint underneath. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: ReactNode
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-display text-[0.95rem] font-bold">
        {label}
      </label>
      {children}
      <FieldNotes id={id} error={error} hint={hint} />
    </div>
  )
}

/** The error, then the hint: some errors point at the hint ("the earliest day shown below"), so it stays under. */
export function FieldNotes({ id, error, hint }: { id: string; error?: string; hint?: ReactNode }) {
  return (
    <>
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-error">
          {error}
        </p>
      )}
      {hint && (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted">
          {hint}
        </p>
      )}
    </>
  )
}

/** A radio card: the input is real and focusable; the card is its label. */
export function OptionCard({
  name,
  value,
  checked,
  disabled,
  onChange,
  inputRef,
  describedBy,
  title,
  note,
}: {
  name: string
  value: string
  checked: boolean
  disabled?: boolean
  onChange: () => void
  inputRef?: (node: HTMLInputElement | null) => void
  describedBy?: string
  title: string
  note: string
}) {
  return (
    <label className={`group relative block ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        ref={inputRef}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        aria-describedby={describedBy}
        className="peer sr-only"
      />
      <span className="flex h-full flex-col gap-0.5 rounded-2xl border-2 border-edge bg-surface px-3.5 py-2.5 transition-[background-color,border-color,box-shadow] group-hover:border-ink peer-checked:border-ink peer-checked:bg-soft peer-checked:shadow-sticker peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-leaf peer-disabled:border-line peer-disabled:bg-cream peer-disabled:text-muted peer-disabled:shadow-none">
        <span className="font-display text-[0.95rem] leading-tight font-bold">{title}</span>
        <span className="text-xs leading-snug text-muted">{note}</span>
      </span>
    </label>
  )
}
