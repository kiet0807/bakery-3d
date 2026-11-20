import type { Metadata } from 'next'
import { CartView } from '@/components/cart/CartView'
import { dictionaries } from '@/i18n/dictionaries'
import { langFrom, pageMetadata } from '@/i18n/metadata'

export async function generateMetadata({ params }: PageProps<'/[lang]/cart'>): Promise<Metadata> {
  const lang = await langFrom(params)
  return pageMetadata(lang, '/cart', dictionaries[lang].cart.meta)
}

export default function CartPage() {
  return <CartView />
}
