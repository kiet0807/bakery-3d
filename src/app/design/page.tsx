import type { Metadata } from 'next'
import { Designer } from '@/components/design/Designer'

export const metadata: Metadata = {
  title: 'Build your cake',
  description:
    'Choose size, sponge, filling, frosting, drip, toppings, candles and a message, and see the cake redrawn in 3D with every choice.',
}

export default function DesignPage() {
  return <Designer />
}
