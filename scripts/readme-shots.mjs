// The README screenshots, the four-palette strip and the social preview, taken on a production build.
//   pnpm build && pnpm start --port 3216
//   node scripts/readme-shots.mjs http://localhost:3216 shots [home story design menu boxed photo phone palettes og]
// Then convert to JPEG: `sips -s format jpeg -s formatOptions 82 shots/x.png --out docs/screenshots/x.jpg`
// (the social previews go to public/og/kais-bakery.jpg and, for the English pages, kais-bakery-en.jpg). The default palette (G1) is used unless a shot sets one.
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'
const [base = 'http://localhost:3216', out = './shots', ...wanted] = process.argv.slice(2)
await mkdir(out, { recursive: true })
const want = (name) => wanted.length === 0 || wanted.includes(name)

const browser = await chromium.launch({
  args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'],
})

async function open(path, { width = 1440, height = 900, dpr = 1, palette, css, intro = false } = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: dpr,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  })
  await context.addInitScript(
    ([pal, skip]) => {
      if (skip) sessionStorage.setItem('kais-bakery-intro-seen', '1')
      if (pal) localStorage.setItem('kais-bakery-palette', pal)
      // The one-time hints (drag to turn, the colour dot's bubble) would sit in every picture.
      for (const hint of ['drag', 'palette']) localStorage.setItem(`kais-bakery-hint-${hint}`, '1')
    },
    [palette ?? null, !intro],
  )
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on(
    'console',
    (m) => m.type() === 'error' && !/WebGL|GPU stall/i.test(m.text()) && errors.push(m.text()),
  )
  await page.goto(new URL(path, base).toString(), { waitUntil: 'load' })
  if (css) await page.addStyleTag({ content: css })
  return { page, context, errors }
}

async function done(name, { context, errors }, shot) {
  const file = `${out}/${name}.png`
  const buffer = await shot(file)
  console.log(name, file, errors.length ? `ERRORS: ${errors.join(' | ').slice(0, 400)}` : 'ok')
  await context.close()
  return buffer
}

if (want('home')) {
  const s = await open('/')
  await s.page.waitForTimeout(9000)
  await done('home', s, (path) => s.page.screenshot({ path }))
}

if (want('story')) {
  const s = await open('/')
  await s.page.waitForTimeout(3000)
  await s.page.locator('[aria-label="Các chương"]').getByText('Cốt bánh', { exact: true }).click()
  await s.page.waitForTimeout(6000)
  await done('story', s, (path) => s.page.screenshot({ path }))
}

if (want('design')) {
  const s = await open('/design?preset=rainbow-birthday')
  await s.page.waitForTimeout(4000)
  await s.page.getByRole('button', { name: 'Cắt bánh xem ruột' }).click()
  await s.page.waitForTimeout(4500)
  await done('design', s, (path) => s.page.screenshot({ path }))
}

if (want('menu')) {
  const s = await open('/menu')
  await s.page.waitForTimeout(7000)
  await done('menu', s, (path) => s.page.screenshot({ path }))
}

if (want('boxed')) {
  const s = await open('/cart')
  const line = {
    id: 'line-strawberry',
    presetId: 'strawberry-cloud',
    quantity: 1,
    config: {
      size: 's16',
      sponge: 'vanilla',
      filling: 'strawberry-jam',
      frosting: 'strawberry-milk',
      drip: 'none',
      toppings: ['strawberries', 'cream-kisses'],
      sweetness: 'less',
      candles: 0,
      message: '',
    },
  }
  await s.page.evaluate(
    (value) => localStorage.setItem('kais-bakery-cart', value),
    JSON.stringify({ state: { items: [line] }, version: 2 }),
  )
  await s.page.reload()
  await s.page.getByRole('textbox', { name: 'Tên người nhận' }).fill('Linh')
  await s.page.getByRole('textbox', { name: 'Số điện thoại' }).fill('0347 551 122')
  await s.page.getByRole('button', { name: /Tiếp tục: chọn ngày nhận/ }).click()
  // The fourth quick-pick day: three days after the earliest, clear of every lead time.
  await s.page.getByRole('group', { name: 'Ngày nhận' }).locator('label').nth(3).click()
  await s.page.getByLabel('Giờ nhận', { exact: true }).selectOption('15:00')
  await s.page.getByText('Chuyển khoản', { exact: true }).click()
  await s.page.getByRole('button', { name: /Chốt đơn thử/ }).click()
  await s.page.getByRole('heading', { level: 1 }).filter({ hasText: 'Đóng hộp xong' }).waitFor()
  await s.page.waitForTimeout(6500)
  await done('boxed', s, (path) => s.page.screenshot({ path }))
}

if (want('photo')) {
  // White cream, dark chocolate drip, strawberries and macarons, a "Happy Birthday" plaque.
  const fields = [
    's18',
    'chocolate',
    'chocolate-ganache',
    'cloud-white',
    'dark-chocolate',
    'strawberries+macarons',
    'less',
    0,
    'Happy Birthday',
  ]
  const token = Buffer.from(JSON.stringify(fields)).toString('base64url')
  const s = await open(`/design#cake=${token}`)
  await s.page.waitForTimeout(5000)
  await s.page.getByRole('button', { name: 'Chụp ảnh studio' }).click()
  await s.page.getByRole('progressbar').waitFor({ state: 'visible', timeout: 30000 })
  await s.page.getByRole('progressbar').waitFor({ state: 'detached', timeout: 240000 })
  await s.page.waitForTimeout(1500)
  const stage = s.page.locator('main div.sticky').first()
  const box = await stage.boundingBox()
  await done('photo', s, (path) =>
    s.page.screenshot({ path, clip: { x: box.x + 2, y: box.y + 2, width: box.width - 4, height: 686 } }),
  )
}

if (want('phone')) {
  const s = await open('/menu', { width: 390, height: 844, dpr: 2 })
  await s.page.waitForTimeout(7000)
  await done('phone-menu', s, (path) => s.page.screenshot({ path }))
}

if (want('palettes')) {
  const sets = [
    ['g1', 'G1 · Matcha Dâu (default)'],
    ['b', 'B · Bơ Bạc Hà'],
    ['g2', 'G2 · Lá Dứa Dừa'],
    ['g3', 'G3 · Rừng Kem'],
  ]
  const tiles = []
  for (const [id, label] of sets) {
    const s = await open('/', { palette: id })
    await s.page.waitForTimeout(9000)
    const buffer = await done(`palette-${id}`, s, (path) => s.page.screenshot({ path }))
    tiles.push({ label, src: `data:image/png;base64,${buffer.toString('base64')}` })
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 920 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  await page.setContent(`<!doctype html><html><body style="margin:0;background:#fff">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px;font:600 22px/1 system-ui,sans-serif">
    ${tiles
      .map(
        (
          t,
        ) => `<figure style="margin:0;position:relative;border-radius:14px;overflow:hidden;border:2px solid #1d3424">
        <img src="${t.src}" style="display:block;width:100%">
        <figcaption style="position:absolute;left:12px;bottom:12px;background:#fff;color:#1d3424;padding:8px 14px;border-radius:999px;border:2px solid #1d3424">${t.label}</figcaption>
      </figure>`,
      )
      .join('')}
    </div></body></html>`)
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${out}/palettes.png`, fullPage: true })
  console.log('palettes', `${out}/palettes.png`, 'ok')
  await context.close()
}

if (want('og'))
  for (const [name, path] of [
    ['og', '/'],
    ['og-en', '/en'],
  ]) {
    const s = await open(path, {
      width: 1200,
      height: 630,
      // Without the header there is room above: the title moves up, clear of the macarons. On the page the scene
      // is drawn over the title (the cake's top overlaps it); here the title goes on top, so no sprinkle drifting
      // through the still picture lands on a letter.
      css: 'header, #story > nav, #story section:first-of-type > * { visibility: hidden !important; } #story h1 { top: 1.75rem !important; z-index: 1; }',
    })
    await s.page.waitForTimeout(9000)
    await done(name, s, (file) => s.page.screenshot({ path: file }))
  }

await browser.close()
