import type { Metadata } from 'next'
import { Vitrine } from '@/components/menu/Vitrine'
import { dictionaries } from '@/i18n/dictionaries'
import { langFrom, pageMetadata } from '@/i18n/metadata'
import { PageTransition } from '@/components/PageTransition'

export async function generateMetadata({ params }: PageProps<'/[lang]/menu'>): Promise<Metadata> {
  const lang = await langFrom(params)
  return pageMetadata(lang, '/menu', dictionaries[lang].menu.meta)
}

export default function MenuPage() {
  return (
    <PageTransition>
      <Vitrine />
    </PageTransition>
  )
}
