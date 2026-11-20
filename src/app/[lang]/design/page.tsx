import type { Metadata } from 'next'
import { Designer } from '@/components/design/Designer'
import { dictionaries } from '@/i18n/dictionaries'
import { langFrom, pageMetadata } from '@/i18n/metadata'

export async function generateMetadata({ params }: PageProps<'/[lang]/design'>): Promise<Metadata> {
  const lang = await langFrom(params)
  return pageMetadata(lang, '/design', dictionaries[lang].design.meta)
}

export default function DesignPage() {
  return <Designer />
}
