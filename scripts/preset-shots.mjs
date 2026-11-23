// The pictures of the six house cakes (home page, cart), taken from the real 3D scene on a see-through background,
// so they sit on the cards of every palette. Retake them when a preset, the light or a topping changes.
//   pnpm build && pnpm start --port 3216
//   node scripts/preset-shots.mjs http://localhost:3216 public/cakes
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const [base = 'http://localhost:3216', out = 'public/cakes'] = process.argv.slice(2)
// The same ids as `PRESETS` in src/lib/presets.ts (preset-pictures.test.ts checks that every one has its picture).
const IDS = [
  'strawberry-cloud',
  'choco-crush',
  'bestie-bento',
  'taro-dream',
  'caramel-crown',
  'rainbow-birthday',
]
const WIDTH = 640
const HEIGHT = 560

await mkdir(out, { recursive: true })
const browser = await chromium.launch({
  args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'],
})
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  reducedMotion: 'reduce',
})
await context.addInitScript(() => {
  for (const hint of ['drag', 'palette']) localStorage.setItem(`kais-bakery-hint-${hint}`, '1')
})

for (const id of IDS) {
  const page = await context.newPage()
  await page.goto(`${base}/design?preset=${id}`, { waitUntil: 'load' })
  await page.addStyleTag({
    content: `html, body { background: transparent !important } *, *::before, *::after { visibility: hidden !important }
      main canvas { visibility: visible !important }
      main div.sticky { background: none !important; border: 0 !important; box-shadow: none !important }`,
  })
  await page.waitForTimeout(5000)
  const shot = await page.locator('main canvas').first().screenshot({ omitBackground: true })
  // Cropped to the cake and its stand, then set on a canvas of one size with the stand's foot on one line.
  const webp = await page.evaluate(
    async ([png, width, height]) => {
      const image = await createImageBitmap(await (await fetch(`data:image/png;base64,${png}`)).blob())
      const full = new OffscreenCanvas(image.width, image.height)
      const ctx = full.getContext('2d')
      ctx.drawImage(image, 0, 0)
      const { data } = ctx.getImageData(0, 0, image.width, image.height)
      let [x0, y0, x1, y1] = [image.width, image.height, 0, 0]
      for (let y = 0; y < image.height; y++)
        for (let x = 0; x < image.width; x++)
          if (data[(y * image.width + x) * 4 + 3] > 200) {
            x0 = Math.min(x0, x)
            x1 = Math.max(x1, x)
            y0 = Math.min(y0, y)
            y1 = Math.max(y1, y)
          }
      const scale = Math.min((width * 0.8) / (x1 - x0), (height * 0.84) / (y1 - y0))
      const picture = new OffscreenCanvas(width, height)
      const target = picture.getContext('2d')
      target.imageSmoothingQuality = 'high'
      target.drawImage(
        image,
        width / 2 - ((x0 + x1) / 2) * scale,
        height * 0.9 - y1 * scale,
        image.width * scale,
        image.height * scale,
      )
      // The soft shadow on the floor is wider than the picture: let it fade out before every edge.
      target.globalCompositeOperation = 'destination-in'
      for (const [x, y] of [
        [width, 0],
        [0, height],
      ]) {
        const fade = target.createLinearGradient(0, 0, x, y)
        const edge = x ? 0.1 : 0.06
        fade.addColorStop(0, 'rgb(0 0 0 / 0)')
        fade.addColorStop(edge, 'rgb(0 0 0 / 1)')
        fade.addColorStop(1 - edge, 'rgb(0 0 0 / 1)')
        fade.addColorStop(1, 'rgb(0 0 0 / 0)')
        target.fillStyle = fade
        target.fillRect(0, 0, width, height)
      }
      const blob = await picture.convertToBlob({ type: 'image/webp', quality: 0.86 })
      const bytes = new Uint8Array(await blob.arrayBuffer())
      let text = ''
      for (const byte of bytes) text += String.fromCharCode(byte)
      return btoa(text)
    },
    [shot.toString('base64'), WIDTH, HEIGHT],
  )
  const bytes = Buffer.from(webp, 'base64')
  await writeFile(`${out}/${id}.webp`, bytes)
  console.log(id, `${Math.round(bytes.length / 1024)} KB`)
  await page.close()
}
await browser.close()
