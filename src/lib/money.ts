import { formatMoney } from '@/i18n/format'
import type { Locale } from '@/i18n/config'

/** Whole đồng, e.g. "350.000đ" (Vietnamese, the default) or "350,000 VND" (English). */
export const money = (dong: number, lang: Locale = 'vi') => formatMoney(dong, lang)
