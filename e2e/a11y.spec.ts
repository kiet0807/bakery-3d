import { cartCount, disableWebGL, expect, skipIntro, test } from './fixtures'

const PAGES = ['/', '/design', '/menu', '/cart']

test.describe('accessibility and resilience', () => {
  for (const path of PAGES) {
    test(`${path} has one main heading, a title and a skip link`, async ({ page }) => {
      await skipIntro(page)
      await page.goto(path)
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page).toHaveTitle(/Crumb & Cloud/)
      await expect(page.locator('html')).toHaveAttribute('lang', 'en')
      await expect(page.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main')
    })
  }

  test('the skip link is the first stop and jumps to the content', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Keyboard navigation is checked on desktop.')
    await page.goto('/design')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Skip to content' })
    await expect(skip).toBeFocused()
    await expect(skip).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#main$/)
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
    await expect(page.getByText(/3D is not available/)).toHaveCount(0)
  })

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' })

    test('the story is all there, without smooth scrolling', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: 'Start the experience' }).click({ timeout: 60_000 })
      await expect(page.getByRole('dialog')).toHaveCount(0)
      const heading = page.getByRole('heading', { level: 2, name: /three thin layers/ })
      await heading.scrollIntoViewIfNeeded()
      await expect(heading).toBeVisible()
      await expect(page.locator('html')).not.toHaveClass(/lenis/)
    })
  })

  test.describe('without WebGL', () => {
    test.beforeEach(async ({ page }) => disableWebGL(page))

    test('the builder shows a drawing and still sells cakes', async ({ page }) => {
      await page.goto('/design')
      await expect(page.getByText(/3D is not available on this device/)).toBeVisible()
      await page.getByRole('button', { name: 'Add to cart' }).click()
      await expect(cartCount(page)).toHaveText('1')
    })

    test('the vitrine shows a drawing and still sells cakes', async ({ page }) => {
      await page.goto('/menu')
      await expect(page.getByText(/3D is not available on this device/)).toBeVisible()
      await page.getByRole('button', { name: 'Next cake' }).click()
      await page
        .getByRole('region', { name: 'Midnight Ganache' })
        .getByRole('button', { name: 'Add to cart' })
        .click()
      await expect(cartCount(page)).toHaveText('1')
    })

    // Without WebGL the story scene reports itself loaded, so the welcome screen still lets the visitor in.
    test('the home page can still be entered', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: 'Start the experience' }).click({ timeout: 20_000 })
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(page.getByRole('heading', { level: 2, name: /three thin layers/ })).toBeAttached()
    })
  })
})
