import type { Metadata } from 'next'
import { CartView } from '@/components/cart/CartView'
import { dictionaries } from '@/i18n/dictionaries'
import { langFrom, pageMetadata } from '@/i18n/metadata'

export async function generateMetadata({ params }: PageProps<'/[lang]/cart'>): Promise<Metadata> {
  const lang = await langFrom(params)
  // The cart only ever shows the visitor's own browser data: nothing there for a search engine.
  return { ...pageMetadata(lang, '/cart', dictionaries[lang].cart.meta), robots: { index: false } }
}

export default function CartPage() {
  return <CartView />
}
