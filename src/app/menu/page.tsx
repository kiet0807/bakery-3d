import type { Metadata } from 'next'
import { Vitrine } from '@/components/menu/Vitrine'

export const metadata: Metadata = {
  title: 'The vitrine',
  description:
    'Six house cakes on a turning glass vitrine in real-time 3D. Lift the cloche, peek inside, and take one home or make it yours.',
}

export default function MenuPage() {
  return <Vitrine />
}
