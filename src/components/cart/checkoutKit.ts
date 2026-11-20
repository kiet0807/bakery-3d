import type { OrderErrors, OrderForm } from '@/lib/order'

/** What each step of the checkout needs to draw its fields: values, ids, error messages, and focus. */
export interface CheckoutKit {
  form: OrderForm
  set: <K extends keyof OrderForm>(field: K, value: OrderForm[K]) => void
  ids: Record<keyof OrderForm, string>
  /** Prefix for the radio groups' names, unique to this form. */
  prefix: string
  /** Only the errors that are showing (fields of a step the visitor has tried to leave). */
  errors: OrderErrors
  message: (field: keyof OrderForm) => string | undefined
  describedBy: (field: keyof OrderForm, hasHint?: boolean) => string | undefined
  /** Lends a field's element to the form, so an error can move the focus to it. */
  register: (field: keyof OrderForm) => (node: HTMLElement | null) => void
}
