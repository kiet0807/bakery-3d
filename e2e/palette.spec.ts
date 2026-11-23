import type { Page } from '@playwright/test'
import { expect, freshHints, skipIntro, test } from './fixtures'

/** The colour switch in the header: four sets, Matcha Dâu (g1) by default, kept in this browser. */
const KEY = 'kais-bakery-palette'
const CREAM = { g1: '#f7f7ec', b: '#fff8e5', g2: '#f4faec', g3: '#fbf7ec' } as const
const NAMES = {
  vi: ['Matcha Dâu', 'Bơ Bạc Hà', 'Lá Dứa Dừa', 'Rừng Kem'],
  en: ['Matcha Strawberry', 'Butter Mint', 'Pandan Coconut', 'Forest Cream'],
}

const html = (page: Page) => page.locator('html')
const cssVar = (page: Page, name: string) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name)
const switchButton = (page: Page) => page.getByRole('button', { name: /^(Đổi màu tiệm|Shop colours)/ })
const group = (page: Page) => page.getByRole('radiogroup')
const radio = (page: Page, name: string) => page.getByRole('radio', { name })
const themeColor = (page: Page) => page.locator('meta[name="theme-color"]')

/** Records what the page looked like when the HTML was parsed, before any React code ran. */
async function recordFirstPaint(page: Page) {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const root = document.documentElement
      Object.assign(window, {
        __firstPaint: {
          palette: root.getAttribute('data-palette'),
          cream: getComputedStyle(root).getPropertyValue('--color-cream').trim(),
        },
      })
    })
  })
}
const firstPaint = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __firstPaint: { palette: string; cream: string } }).__firstPaint,
  )

test.describe('palette switch', () => {
  test.beforeEach(async ({ page }) => {
    await skipIntro(page)
  })

  test('starts on Matcha Dâu, and the toolbar colour matches', async ({ page }) => {
    await page.goto('/')
    await expect(html(page)).toHaveAttribute('data-palette', 'g1')
    expect(await cssVar(page, '--color-cream')).toBe(CREAM.g1)
    await expect(themeColor(page)).toHaveAttribute('content', CREAM.g1)
    const button = switchButton(page)
    await expect(button).toHaveAccessibleName('Đổi màu tiệm, đang dùng Matcha Dâu')
    await expect(button).toHaveAttribute('aria-expanded', 'false')
    // The card is in the page but hidden, so aria-controls always points at something.
    const panel = page.locator(`#${await button.getAttribute('aria-controls')}`)
    await expect(panel).toBeAttached()
    await expect(panel).toBeHidden()
  })

  test('a picked set repaints the page, is kept, and is there before the first paint', async ({
    page,
    consoleErrors,
  }) => {
    await recordFirstPaint(page)
    // Pages without a 3D scene keep this test quick; the home page's default is checked above.
    await page.goto('/about')
    await switchButton(page).click()
    await expect(group(page)).toBeVisible()
    await expect(group(page).getByRole('radio')).toHaveCount(4)
    await expect(radio(page, 'Matcha Dâu')).toHaveAttribute('aria-checked', 'true')

    await radio(page, 'Lá Dứa Dừa').click()
    await expect(group(page)).toBeHidden()
    await expect(switchButton(page)).toBeFocused()
    await expect(html(page)).toHaveAttribute('data-palette', 'g2')
    expect(await cssVar(page, '--color-cream')).toBe(CREAM.g2)
    await expect(themeColor(page)).toHaveAttribute('content', CREAM.g2)
    await expect(switchButton(page)).toHaveAccessibleName('Đổi màu tiệm, đang dùng Lá Dứa Dừa')
    expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe('g2')

    // Reload: the inline script in <head> applies the set while the HTML is parsed, so there is no flash of g1.
    await page.reload()
    expect(await firstPaint(page)).toEqual({ palette: 'g2', cream: CREAM.g2 })
    await expect(html(page)).toHaveAttribute('data-palette', 'g2')
    await expect(themeColor(page)).toHaveAttribute('content', CREAM.g2)

    // Another page of the visit, and the 404 page with its own layout, keep it too.
    await page.goto('/faq')
    expect(await firstPaint(page)).toEqual({ palette: 'g2', cream: CREAM.g2 })
    await page.goto('/khong-co-trang-nay')
    expect(await firstPaint(page)).toEqual({ palette: 'g2', cream: CREAM.g2 })
    // The browser logs the 404 status of that page itself; it is expected here.
    for (let i = consoleErrors.length - 1; i >= 0; i--)
      if (/status of 404/.test(consoleErrors[i])) consoleErrors.splice(i, 1)
  })

  test('ignores a saved value it does not know', async ({ page }) => {
    await page.addInitScript((key) => localStorage.setItem(key, '"><script>alert(1)</script>'), KEY)
    await page.goto('/')
    await expect(html(page)).toHaveAttribute('data-palette', 'g1')
  })

  test('works from the keyboard as a radio group', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Keyboard use is checked on desktop.')
    await page.goto('/about')
    const button = switchButton(page)
    // Tab through the header until the switch has the focus.
    for (let i = 0; i < 15 && !(await button.evaluate((el) => el === document.activeElement)); i++)
      await page.keyboard.press('Tab')
    await expect(button).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    await expect(radio(page, 'Matcha Dâu')).toBeFocused()
    // Roving focus: only the checked option is a Tab stop.
    await expect(radio(page, 'Matcha Dâu')).toHaveAttribute('tabindex', '0')
    await expect(radio(page, 'Bơ Bạc Hà')).toHaveAttribute('tabindex', '-1')

    // Arrows move and apply at once (a live preview); they wrap around.
    await page.keyboard.press('ArrowDown')
    await expect(radio(page, 'Bơ Bạc Hà')).toBeFocused()
    await expect(radio(page, 'Bơ Bạc Hà')).toHaveAttribute('aria-checked', 'true')
    await expect(html(page)).toHaveAttribute('data-palette', 'b')
    await page.keyboard.press('ArrowRight')
    await expect(html(page)).toHaveAttribute('data-palette', 'g2')
    await page.keyboard.press('ArrowUp')
    await expect(html(page)).toHaveAttribute('data-palette', 'b')
    await page.keyboard.press('End')
    await expect(radio(page, 'Rừng Kem')).toBeFocused()
    await page.keyboard.press('Home')
    await expect(radio(page, 'Matcha Dâu')).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(radio(page, 'Rừng Kem')).toBeFocused()
    await expect(group(page).getByRole('radio', { checked: true })).toHaveCount(1)

    // Enter keeps it and closes, the focus goes back to the button.
    await page.keyboard.press('Enter')
    await expect(group(page)).toBeHidden()
    await expect(button).toBeFocused()
    await expect(html(page)).toHaveAttribute('data-palette', 'g3')

    // Esc closes without changing anything.
    await page.keyboard.press('Enter')
    await expect(radio(page, 'Rừng Kem')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(group(page)).toBeHidden()
    await expect(button).toBeFocused()
    await expect(html(page)).toHaveAttribute('data-palette', 'g3')

    // Tabbing away closes it too.
    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    await expect(group(page)).toBeHidden()
  })

  test('a click outside closes the card', async ({ page }) => {
    await page.goto('/faq')
    await switchButton(page).click()
    await expect(group(page)).toBeVisible()
    // A tap on the page's empty margin, below the card (on phones the card covers the top of the page).
    const { height } = page.viewportSize()!
    await page.mouse.click(6, height - 60)
    await expect(group(page)).toBeHidden()
    await expect(html(page)).toHaveAttribute('data-palette', 'g1')
  })

  test('speaks English on /en', async ({ page }) => {
    await page.goto('/en')
    const button = switchButton(page)
    await expect(button).toHaveAccessibleName('Shop colours, now Matcha Strawberry')
    await button.click()
    await expect(group(page)).toHaveAccessibleName('Shop colours')
    for (const name of NAMES.en) await expect(radio(page, name)).toBeVisible()
    await radio(page, 'Forest Cream').click()
    await expect(html(page)).toHaveAttribute('data-palette', 'g3')
    await expect(button).toHaveAccessibleName('Shop colours, now Forest Cream')
  })

  test('the card and the header fit the screen', async ({ page }) => {
    await page.goto('/')
    const overflow = await page.evaluate(() => {
      const nav = document.querySelector('header nav')!
      return nav.scrollWidth - nav.clientWidth
    })
    expect(overflow, 'header links overflow').toBeLessThanOrEqual(0)
    await switchButton(page).click()
    for (const name of NAMES.vi) await expect(radio(page, name)).toBeVisible()
    const box = (await page
      .locator(`#${await switchButton(page).getAttribute('aria-controls')}`)
      .boundingBox())!
    const width = page.viewportSize()!.width
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(width)
  })

  test('the header keeps the shop name, clear of the links', async ({ page }) => {
    for (const path of ['/', '/en']) {
      await page.goto(path)
      const { width, room } = await page.evaluate(() => {
        const nav = document.querySelector('header nav')!
        const name = nav.querySelector('a')!.querySelector(':scope > span')!.getBoundingClientRect()
        // When the row is too full, flexbox squeezes the space after the name down to the bare gap (4 px).
        const next = [...nav.children].slice(1).find((item) => item.getBoundingClientRect().width > 0)!
        return { width: name.width, room: next.getBoundingClientRect().left - name.right }
      })
      expect(width, `the name "Kai's Bakery" on ${path}`).toBeGreaterThan(40)
      expect(room, `room after the name on ${path}`).toBeGreaterThan(12)
    }
  })
})

const bubble = (page: Page) => page.locator('[data-hint="palette"]')

test.describe('palette bubble', () => {
  test('on a phone, a bubble says once what the dot does', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'From 1024 px the switch shows its words: no bubble.')
    await freshHints(page)
    await page.goto('/faq')
    await expect(bubble(page)).toBeVisible()
    await expect(bubble(page)).toHaveAttribute('aria-hidden', 'true')
    await expect(bubble(page)).toContainText('Chấm này đổi màu cả tiệm')
    // Whole on screen, although the dot is near the right edge.
    const box = (await bubble(page).locator('div').first().boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width)

    // A tap on it opens the switch; the bubble goes and does not come back.
    await bubble(page).locator('div').first().click()
    await expect(group(page)).toBeVisible()
    await expect(bubble(page)).toHaveCount(0)
    expect(await page.evaluate(() => window.localStorage.getItem('kais-bakery-hint-palette'))).toBe('1')
    await page.keyboard.press('Escape')
    await page.reload()
    await page.waitForTimeout(3_500)
    await expect(bubble(page)).toHaveCount(0)
  })

  test('on a phone, scrolling on sends the bubble away', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'From 1024 px the switch shows its words: no bubble.')
    await freshHints(page)
    await page.goto('/faq')
    await expect(bubble(page)).toBeVisible()
    await page.evaluate(() => window.scrollBy({ top: 200, behavior: 'instant' }))
    await expect(bubble(page)).toHaveCount(0, { timeout: 2_000 })
  })

  test("on a phone, the bubble never covers the note on the builder's stage", async ({ page, isMobile }) => {
    test.skip(!isMobile, 'From 1024 px the switch shows its words: no bubble.')
    await freshHints(page)
    // The other hint of this page is out of the way, so the bubble's turn has come.
    await page.addInitScript(() => window.localStorage.setItem('kais-bakery-hint-drag', '1'))
    await page.goto('/design')
    await expect(page.getByText('Hình minh họa 3D')).toBeVisible()
    await page.waitForTimeout(4_000)
    await expect(bubble(page)).toHaveCount(0)
  })

  test('never over the welcome screen or the title, and not on desktop', async ({ page, isMobile }) => {
    await freshHints(page)
    await page.goto('/')
    await expect(page.getByRole('dialog')).toBeVisible()
    // Well past the bubble's two-second beat: the header is inert behind the welcome screen.
    await page.waitForTimeout(4_000)
    await expect(bubble(page)).toHaveCount(0)
    await page.getByRole('button', { name: 'Vào tiệm thôi' }).click({ timeout: 60_000 })
    // On a phone the title sits right under the header, where the bubble would go: it waits for the story to
    // fade the title out.
    await page.waitForTimeout(4_000)
    await expect(bubble(page)).toHaveCount(0)
    const title = page.getByRole('main').getByRole('heading', { level: 1 })
    // One screen down (a wheel step scrolls less on a phone's pixel ratio): the first chapter, title gone.
    await page.evaluate(() => window.scrollTo(0, window.innerHeight))
    if (isMobile) {
      await expect(bubble(page)).toBeVisible()
      await expect(title).toHaveCSS('opacity', '0')
    } else {
      await page.waitForTimeout(4_000)
      await expect(bubble(page)).toHaveCount(0)
    }
  })
})
