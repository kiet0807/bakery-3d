import { INTRO_KEY, expect, skipIntro, test } from './fixtures'

const CHAPTER_HEADINGS = [
  /three thin layers/,
  /Nothing comes from a tube/,
  /rolls over the edge/,
  /You choose what goes on top/,
]

test.describe('home', () => {
  test('the welcome screen opens the story and is remembered for the visit', async ({ page }) => {
    await page.goto('/')
    const gate = page.getByRole('dialog', { name: /Welcome to/ })
    await expect(gate).toBeVisible()

    // The button only appears once the scene has really loaded, and takes the focus.
    const start = page.getByRole('button', { name: 'Start the experience' })
    await expect(start).toBeVisible({ timeout: 60_000 })
    await expect(start).toBeFocused()
    await start.click()
    await expect(gate).toHaveCount(0)
    expect(await page.evaluate((key) => window.sessionStorage.getItem(key), INTRO_KEY)).toBe('1')
    await expect(page.getByRole('heading', { level: 1, name: /Crumb/ })).toBeAttached()

    // Same visit: straight in.
    await page.reload()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1, name: /Crumb/ })).toBeAttached()
  })

  test('the story has its chapters and leads to the builder and the vitrine', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/')
    for (const name of CHAPTER_HEADINGS) {
      await expect(page.getByRole('heading', { level: 2, name })).toBeAttached()
    }
    await expect(page.getByRole('link', { name: 'Visit the vitrine' })).toHaveAttribute('href', '/menu')
    await expect(page.getByRole('heading', { name: 'Six house cakes, ready to change.' })).toBeAttached()
    await expect(page.getByRole('link', { name: /Make it yours/ })).toHaveCount(6)

    const build = page.getByRole('link', { name: 'Build your cake' })
    await expect(build).toHaveAttribute('href', '/design')
    await build.scrollIntoViewIfNeeded()
    await build.click()
    await expect(page).toHaveURL(/\/design$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Build your cake' })).toBeVisible()
  })

  test('the side index follows and drives the story', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The side index is shown on wide screens only.')
    await skipIntro(page)
    await page.goto('/')
    const index = page.getByRole('navigation', { name: 'Chapters' })
    await expect(index.getByRole('button')).toHaveCount(6)
    await expect(index.getByRole('button', { name: /Intro/ })).toHaveAttribute('aria-current', 'step')
    await index.getByRole('button', { name: /The crown/ }).click()
    await expect(index.getByRole('button', { name: /The crown/ })).toHaveAttribute('aria-current', 'step', {
      timeout: 20_000,
    })
  })
})
