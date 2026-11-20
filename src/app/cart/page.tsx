import type { Metadata } from 'next'
import { CartView } from '@/components/cart/CartView'

export const metadata: Metadata = {
  title: 'Your cart',
  description:
    'Review your cakes, choose a pickup day and watch your order boxed up in 3D. A demo checkout: nothing is sent and no payment is taken.',
}

export default function CartPage() {
  return <CartView />
}
