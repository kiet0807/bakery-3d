import { INTRO_KEY, expect, skipIntro, test } from './fixtures'

/** The four story chapters, by the highlighted words of their headings. */
const CHAPTERS = {
  vi: [
    /ba lớp mỏng tang/,
    /Không có gì bóp ra từ tuýp hết/,
    /ít ngọt, mịn như mây/,
    /Trên bánh có gì là do bạn chốt/,
  ],
  en: [
    /three thin layers/,
    /Nothing squeezed from a tube/,
    /less sweet and cloud-soft/,
    /What goes on top is your call/,
  ],
}

test.describe('home', () => {
  test('the welcome screen opens the story and is remembered for the visit', async ({ page }) => {
    await page.goto('/')
    const gate = page.getByRole('dialog', { name: /Chào mừng tới/ })
    await expect(gate).toBeVisible()
    // While the gate is up, the page behind it is inert: Tab cannot reach links hidden under it.
    await expect(page.locator('header').first()).toHaveAttribute('inert')

    // Content first: the way in is there at once and has the focus; a status line follows the 3D scene.
    const start = page.getByRole('button', { name: 'Vào tiệm thôi' })
    await expect(start).toBeVisible()
    await expect(start).toBeFocused()
    await expect(gate.getByRole('status')).toHaveText('Cảnh 3D ra lò rồi nè', { timeout: 60_000 })
    await start.click()
    await expect(gate).toHaveCount(0)
    await expect(page.locator('header').first()).not.toHaveAttribute('inert')
    expect(await page.evaluate((key) => window.sessionStorage.getItem(key), INTRO_KEY)).toBe('1')
    await expect(page.getByRole('heading', { level: 1, name: /Kai's Bakery/ })).toBeAttached()

    // Same visit: straight in.
    await page.reload()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1, name: /Kai's Bakery/ })).toBeAttached()
  })

  test('coming in before the 3D scene is there: the page works and the cake still gets its opening', async ({
    page,
  }) => {
    // Hold back the scene's code (the chunk that knows where the café light lives) until the visitor is in.
    let release = () => {}
    const held = new Promise<void>((resolve) => (release = resolve))
    await page.route('**/_next/static/chunks/**', async (route) => {
      const response = await route.fetch()
      const body = await response.text()
      if (body.includes('comfy_cafe_1k')) await held
      await route.fulfill({ response, body })
    })
    // The held chunk may hold the load event too (dev preloads it): the page is usable long before that.
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const gate = page.getByRole('dialog', { name: /Chào mừng tới/ })
    await expect(gate.getByRole('status')).toHaveText('Đang nướng cảnh 3D')
    await page.getByRole('button', { name: 'Vào tiệm thôi' }).click()
    await expect(gate).toHaveCount(0)

    // The story is there to read, and a small note says the cake is on its way.
    await expect(page.getByRole('heading', { level: 1, name: /Kai's Bakery/ })).toBeVisible()
    await expect(page.getByText('Bánh kem làm tay, dựng bằng 3D.')).toBeVisible()
    const note = page.locator('p', { hasText: 'Bánh 3D sắp ra lò' })
    await expect(note).toHaveCSS('opacity', '1')

    release()
    await expect(note).toHaveCSS('opacity', '0', { timeout: 60_000 })
  })

  test('the title says the shop name and its tagline', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/')
    const title = page.getByRole('heading', { level: 1 })
    await expect(title).toHaveAccessibleName("Kai's Bakery, Tiệm Bánh Thủ Công")
    // The tagline sticker sits above the words, clear of the 3D cake drawn over the lower half.
    const sticker = title.getByText('Tiệm Bánh Thủ Công', { exact: true })
    const word = title.getByText('Bakery', { exact: true })
    const [stickerBox, wordBox] = [await sticker.boundingBox(), await word.boundingBox()]
    expect(stickerBox && wordBox && stickerBox.y < wordBox.y).toBe(true)
  })

  test('the story has its chapters and leads to the builder and the vitrine', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/')
    for (const name of CHAPTERS.vi) {
      await expect(page.getByRole('heading', { level: 2, name })).toBeAttached()
    }
    const story = page.getByRole('region', { name: 'Câu chuyện chiếc bánh' })
    await expect(story.getByRole('link', { name: 'Xem menu bánh' })).toHaveAttribute('href', '/menu')

    await expect(
      page.getByRole('heading', { level: 2, name: '6 mẫu bánh, đổi gì cũng được.' }),
    ).toBeAttached()
    const cards = page.getByRole('link', { name: /Đổi theo ý bạn/ })
    await expect(cards).toHaveCount(6)
    await expect(cards.first()).toHaveAttribute('href', /^\/design\?preset=[a-z-]+$/)
    await expect(cards.first()).toContainText('350.000')

    // Every card has its cake's picture.
    const pictures = cards.locator('img')
    await expect(pictures).toHaveCount(6)
    await pictures.last().scrollIntoViewIfNeeded()
    await expect
      .poll(() => pictures.last().evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
      .toBe(640)

    // The story's last button (phones also have one on the first screen).
    const build = story.getByRole('link', { name: 'Tự thiết kế bánh' }).last()
    await expect(build).toHaveAttribute('href', '/design')
    await build.scrollIntoViewIfNeeded()
    await build.click()
    await expect(page).toHaveURL(/\/design$/)
    await expect(page.getByRole('heading', { level: 1, name: /Tự thiết kế/ })).toBeVisible()
  })

  test('on a phone the builder is one tap away on the first screen', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Wide screens have the builder in the header.')
    await skipIntro(page)
    await page.goto('/')
    const build = page.getByRole('region', { name: 'Mở đầu' }).getByRole('link', { name: 'Tự thiết kế bánh' })
    await expect(build).toBeInViewport({ ratio: 1 })
    await build.click()
    await expect(page).toHaveURL(/\/design$/)
  })

  test('the sections under the story say what the shop is', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 2, name: 'Bánh xinh xỉu, ngọt vừa đủ.' })).toBeAttached()
    await expect(page.getByRole('heading', { level: 3, name: 'Ít ngọt là mặc định' })).toBeAttached()
    await expect(page.getByRole('heading', { level: 2, name: 'Dễ như ăn bánh.' })).toBeAttached()
  })

  test('the side index follows and drives the story', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The side index is shown on wide screens only.')
    await skipIntro(page)
    await page.goto('/')
    const index = page.getByRole('navigation', { name: 'Các chương' })
    await expect(index.getByRole('button')).toHaveCount(6)
    await expect(index.getByRole('button', { name: /Mở đầu/ })).toHaveAttribute('aria-current', 'step')
    await index.getByRole('button', { name: /Trang trí/ }).click()
    await expect(index.getByRole('button', { name: /Trang trí/ })).toHaveAttribute('aria-current', 'step', {
      timeout: 20_000,
    })
  })

  test('the side index leaves the Tab order when it fades out', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The side index is shown on wide screens only.')
    await skipIntro(page)
    await page.goto('/')
    const index = page.locator('nav[aria-label="Các chương"]')
    await expect(index).not.toHaveAttribute('inert')
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect(index).toHaveAttribute('inert', '')
  })

  test('the English home page tells the same story under /en', async ({ page }) => {
    await page.goto('/en')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    const gate = page.getByRole('dialog', { name: /Welcome to/ })
    await expect(gate).toBeVisible()
    await expect(gate.getByRole('status')).toHaveText('The 3D scene is fresh out of the oven', {
      timeout: 60_000,
    })
    await page.getByRole('button', { name: 'Come on in' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName("Kai's Bakery, Handmade Cakes")
    for (const name of CHAPTERS.en) {
      await expect(page.getByRole('heading', { level: 2, name })).toBeAttached()
    }
    const cards = page.getByRole('link', { name: /Make it yours/ })
    await expect(cards).toHaveCount(6)
    await expect(cards.first()).toHaveAttribute('href', /^\/en\/design\?preset=[a-z-]+$/)
    const story = page.getByRole('region', { name: 'The story of a cake' })
    await expect(story.getByRole('link', { name: 'Design your cake' }).last()).toHaveAttribute(
      'href',
      '/en/design',
    )
  })
})
