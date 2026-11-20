import { cartCount, disableWebGL, expect, skipIntro, test } from './fixtures'

/** Every page in both languages: Vietnamese at `/…` without a prefix, English under `/en`. */
const PAGES = ['/', '/design', '/menu', '/cart', '/about', '/policies', '/faq']
const LANGS = [
  { prefix: '', lang: 'vi', skip: 'Vào nội dung chính' },
  { prefix: '/en', lang: 'en', skip: 'Skip to content' },
] as const

/** The 2D drawing's note when a device has no WebGL, in Vietnamese (`scenes.fallback`). */
const NO_3D = /Máy này chưa chạy được 3D/

test.describe('accessibility and resilience', () => {
  for (const { prefix, lang, skip } of LANGS) {
    for (const path of PAGES) {
      const url = prefix + path === '/en/' ? '/en' : prefix + path
      test(`${url} has one main heading, a title, its language and a skip link`, async ({ page }) => {
        await skipIntro(page)
        await page.goto(url)
        await expect(page.locator('h1')).toHaveCount(1)
        await expect(page).toHaveTitle(/Kai's Bakery/)
        await expect(page.locator('html')).toHaveAttribute('lang', lang)
        await expect(page.getByRole('link', { name: skip })).toHaveAttribute('href', '#main')
      })
    }
  }

  test('the skip link is the first stop and jumps to the content', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Keyboard navigation is checked on desktop.')
    await page.goto('/design')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Vào nội dung chính' })
    await expect(skip).toBeFocused()
    await expect(skip).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#main$/)
  })

  test('every page says the shop is not real', async ({ page }) => {
    await skipIntro(page)
    for (const path of ['/', '/en']) {
      await page.goto(path)
      const footer = page.getByRole('contentinfo')
      await expect(footer).toContainText(path === '/' ? /không có thật/ : /not a real/i)
    }
  })

  test.describe('on the high quality tier', () => {
    test.use({ quality: 'high' })

    // Post-processing, the café HDRI, shadow maps and the reflective vitrine floor only run here.
    for (const path of ['/', '/design']) {
      test(`${path} renders without errors`, async ({ page, isMobile }) => {
        test.skip(isMobile, 'Phones always start on the light tier.')
        await skipIntro(page)
        await page.goto(path)
        await expect(page.locator('canvas').first()).toBeAttached({ timeout: 30_000 })
        // Give the scene a few seconds of frames: shader compilation and the HDRI load happen here.
        await page.waitForTimeout(4_000)
        await expect(page.locator('h1')).toHaveCount(1)
      })
    }
  })

  test('the vitrine renders in 3D', async ({ page }) => {
    test.slow()
    await page.goto('/menu')
    await expect(page.locator('canvas').first()).toBeAttached({ timeout: 90_000 })
    await expect(page.getByText(NO_3D)).toHaveCount(0)
  })

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' })

    test('the story is all there, without smooth scrolling', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: 'Vào tiệm thôi' }).click({ timeout: 60_000 })
      await expect(page.getByRole('dialog')).toHaveCount(0)
      const heading = page.getByRole('heading', { level: 2, name: /ba lớp mỏng tang/ })
      await heading.scrollIntoViewIfNeeded()
      await expect(heading).toBeVisible()
      await expect(page.locator('html')).not.toHaveClass(/lenis/)
    })
  })

  test.describe('without WebGL', () => {
    test.beforeEach(async ({ page }) => disableWebGL(page))

    test('the builder shows a drawing and still sells cakes', async ({ page }) => {
      await page.goto('/design')
      await expect(page.getByText(NO_3D)).toBeVisible()
      await page.getByRole('button', { name: 'Thêm vào giỏ' }).click()
      await expect(cartCount(page)).toHaveText('1')
    })

    test('the vitrine shows a drawing and still sells cakes', async ({ page }) => {
      await page.goto('/menu')
      await expect(page.getByText(NO_3D)).toBeVisible()
      await page.getByRole('button', { name: 'Bánh tiếp theo' }).click()
      await page
        .getByRole('region', { name: 'Socola Crush' })
        .getByRole('button', { name: 'Thêm vào giỏ' })
        .click()
      await expect(cartCount(page)).toHaveText('1')
    })

    // Without WebGL the story scene reports itself loaded, so the welcome screen still lets the visitor in.
    test('the home page can still be entered', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: 'Vào tiệm thôi' }).click({ timeout: 20_000 })
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(page.getByRole('heading', { level: 2, name: /ba lớp mỏng tang/ })).toBeAttached()
    })

    test('the English pages draw the fallback in English', async ({ page }) => {
      await page.goto('/en/design')
      await expect(page.getByText(NO_3D)).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Add to cart' })).toBeVisible()
    })
  })
})
