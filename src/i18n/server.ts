import { lang } from 'next/root-params'
import { DEFAULT_LOCALE, hasLocale, type Locale } from './config'
import { dictionaries } from './dictionaries'

/** The page's language, for Server Components and metadata. */
export async function getLang(): Promise<Locale> {
  const value = await lang()
  return hasLocale(value) ? value : DEFAULT_LOCALE
}

export async function getDict() {
  return dictionaries[await getLang()]
}
