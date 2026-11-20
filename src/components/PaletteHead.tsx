import { PALETTE_SCRIPT, paletteCss } from '@/lib/palettes'

/**
 * Goes in each root layout's `<head>`, with `<html data-palette={DEFAULT_PALETTE} suppressHydrationWarning>`.
 * The script applies the visitor's saved palette before the first paint (no flash of the default set), and the
 * style holds every set's variables. Both are built from constants, never from visitor input.
 * See node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md, "Themes".
 */
export function PaletteHead() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: PALETTE_SCRIPT }} />
      <style dangerouslySetInnerHTML={{ __html: paletteCss() }} />
    </>
  )
}
