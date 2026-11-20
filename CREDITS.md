# Credits

Kai's Bakery is a web project, not a real shop. The code is MIT licensed (see [LICENSE](LICENSE)); the assets below keep their own
licences.

## Light

- **“Comfy Café” HDRI** by Sergej Majboroda, from [Poly Haven](https://polyhaven.com/a/comfy_cafe), CC0.
  Used at 1K (`public/hdri/comfy_cafe_1k.hdr`) for reflections on the high quality tier.

## Fonts

- **Baloo 2** by Ek Type, SIL Open Font License 1.1. Headings. Loaded through `next/font/google` and served
  from this site.
- **Be Vietnam Pro** by Lâm Bảo, Tony Le and ViệtAnh Nguyễn, SIL Open Font License 1.1. Body text, chosen for
  its Vietnamese diacritics. Loaded through `next/font/google`.
- **Pacifico** by Vernon Adams (The Pacifico Project Authors), SIL Open Font License 1.1. Used for the logo,
  the writing on the cake and the box lid. The licence text sits next to the file: `public/fonts/Pacifico-OFL.txt`.

## 3D models

None. Every cake, stand, cloche, cloud and box is generated in code.

## Libraries

- [Next.js](https://nextjs.org), [React](https://react.dev), [TypeScript](https://www.typescriptlang.org)
- [three.js](https://threejs.org), [React Three Fiber](https://r3f.docs.pmnd.rs),
  [drei](https://drei.docs.pmnd.rs), [postprocessing](https://github.com/pmndrs/postprocessing) and
  [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing), with
  [N8AO](https://github.com/N8python/n8ao) for ambient occlusion
- [three-gpu-pathtracer](https://github.com/gkjohnson/three-gpu-pathtracer) and
  [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh)
- [Lenis](https://lenis.darkroom.engineering) for smooth scrolling, [zustand](https://zustand.docs.pmnd.rs)
  for state, [Tailwind CSS](https://tailwindcss.com) for styling
- [Vitest](https://vitest.dev) and [Playwright](https://playwright.dev) for tests

All are MIT licensed, except postprocessing (zlib) and N8AO (ISC). Playwright and TypeScript, used only to build
and test, are Apache-2.0.

## Inspiration

- Interaction patterns inspired by [DeepSee Commerce](https://deepseecommerce.com) (a welcome gate, a giant
  title behind the 3D object, scroll chapters with a side index, a descent into darkness). No assets, text or
  branding were copied.

## Colour

- Palette "Bơ Bạc Hà" (butter and mint), picked by the owner from three options on 2026-11-20. Every text pair
  is measured against WCAG 2.2 AA by `src/lib/contrast.test.ts`.

## Market research

- Prices, sizes and lead times were set from cake shops that publish them online in Ho Chi Minh City and Hà Nội
  (Tín Phát Bakery, Bánh kem Hannie, Sweet Cakes). Style reference: KICA Bakery in Thủ Đức. No text, photos
  or branding from any shop were used.
