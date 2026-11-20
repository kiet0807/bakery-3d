'use client'

import { useLang } from '@/i18n/LangProvider'
import { money } from '@/lib/money'
import { useTickingNumber } from '@/lib/useTickingNumber'

/**
 * An amount in đồng that runs to its new value when it changes (the builder's price, the cart total). Its own
 * component, so only these few characters re-render while the number runs. Use inside a `tabular-nums` element, so
 * the digits keep their width as they change.
 */
export function TickingMoney({ value }: { value: number }) {
  const lang = useLang()
  return <>{money(useTickingNumber(value), lang)}</>
}
