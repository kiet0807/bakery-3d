import type { Locale } from './config'

const vnd = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })
const vndEn = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

/** Đồng the way each audience reads them: "350.000đ" in Vietnamese, "350,000 VND" in English. */
export function formatMoney(dong: number, lang: Locale = 'vi'): string {
  return lang === 'en' ? `${vndEn.format(dong)} VND` : `${vnd.format(dong)}đ`
}

/** "+30.000đ" for a surcharge. */
export const formatSurcharge = (dong: number, lang: Locale = 'vi') => `+${formatMoney(dong, lang)}`
