import { test as base, expect, type ConsoleMessage, type Locator, type Page } from '@playwright/test'

/**
 * Console noise that is not ours: React Three Fiber's own deprecation notice, the GPU warnings of the
 * software renderer used in CI, and the browser asking for a favicon.
 */
const IGNORED: RegExp[] = [/THREE\.Clock/, /WebGL/i, /GPU stall/i, /swiftshader/i]

function ignored(message: ConsoleMessage) {
  return IGNORED.some((pattern) => pattern.test(message.text())) || message.location().url.includes('favicon')
}

type Quality = 'low' | 'high'

/**
 * - `quality`: tests run on the app's light tier by default (the device reports two CPU cores, which the app
 *   treats like a phone). The software renderer of a CI runner draws the high tier's post-processing and
 *   reflections slowly enough to starve the page; `test.use({ quality: 'high' })` opts back in.
 * - `consoleErrors`: every test fails if the page logs an error or throws, unless the message is known noise.
 */
export const test = base.extend<{ quality: Quality; consoleErrors: string[] }>({
  quality: ['low', { option: true }],
  page: async ({ page, quality }, provide) => {
    if (quality === 'low')
      await page.addInitScript(() =>
        Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => 2 }),
      )
    await provide(page)
  },
  consoleErrors: [
    async ({ page }, provide) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
      page.on('console', (message) => {
        if (message.type() === 'error' && !ignored(message)) errors.push(message.text())
      })
      await provide(errors)
      expect(errors, 'errors logged by the page').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

export const INTRO_KEY = 'kais-bakery-intro-seen'
export const CART_KEY = 'kais-bakery-cart'

/** Skips the welcome screen, as if the visitor had already pressed Start in this browser session. */
export async function skipIntro(page: Page) {
  await page.addInitScript((key) => window.sessionStorage.setItem(key, '1'), INTRO_KEY)
}

/**
 * Scrolls an element to two thirds down the screen, then clicks it. On phones the builder's 3D stage sticks
 * under the header and the price bar is fixed at the bottom; Playwright's own scrolling (top, centre or end)
 * would leave the target under one of them, while a person scrolls it into the open band between.
 *
 * With two 3D pages in parallel on the software renderer, frames come seconds apart. The share button then sat
 * still and uncovered in the band (traced frame by frame), yet Playwright's stability check kept failing and its
 * own retries scrolled the button under the price bar until the test timed out, on about half of the phone runs.
 * So each attempt scrolls the target back into the band and checks that its centre is really the target (the same
 * test Playwright makes: visible, and nothing on top). Only that check is retried. The click itself happens once,
 * trusting the check (force) with a long timeout: on GitHub's software renderer a click can take seconds to be
 * acknowledged and still land, and a retried click then added two candles instead of one (2026-11-20).
 */
export async function clickInBand(target: Locator) {
  await expect(async () => {
    const clear = await target.evaluate(async (element) => {
      await document.fonts.ready
      const { top } = element.getBoundingClientRect()
      window.scrollBy(0, top - window.innerHeight * 0.66)
      await new Promise((settled) => requestAnimationFrame(() => requestAnimationFrame(settled)))
      const box = element.getBoundingClientRect()
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      return hit !== null && element.contains(hit)
    })
    expect(clear, 'the target is clear of the sticky stage and the fixed bars').toBe(true)
  }).toPass({ timeout: 60_000 })
  await target.click({ force: true, timeout: 30_000 })
}

/** The number in the header's cart button. */
export const cartCount = (page: Page) => page.getByLabel(/(in the cart|trong giỏ)$/)

interface SeedItem {
  id: string
  presetId?: string
  quantity: number
  config: Record<string, unknown>
}

export const STRAWBERRY_CLOUD = {
  size: 's16',
  sponge: 'vanilla',
  filling: 'strawberry-jam',
  frosting: 'strawberry-milk',
  drip: 'none',
  toppings: ['strawberries', 'cream-kisses'],
  sweetness: 'less',
  candles: 0,
  message: '',
}

export const RAINBOW_BIRTHDAY = {
  size: 's18',
  sponge: 'vanilla',
  filling: 'vanilla-cream',
  frosting: 'cloud-white',
  drip: 'strawberry',
  toppings: ['sprinkles', 'macarons'],
  sweetness: 'less',
  candles: 5,
  message: 'Happy Birthday',
}

/** Writes a saved cart the way the store persists it, then reloads so the page reads it. */
export async function seedCart(page: Page, items: SeedItem[]) {
  await page.evaluate(([key, value]) => window.localStorage.setItem(key, value), [
    CART_KEY,
    JSON.stringify({ state: { items }, version: 2 }),
  ] as const)
  await page.reload()
}

/** Tomorrow as YYYY-MM-DD in the browser's own time zone. */
export const tomorrowInBrowser = (page: Page) =>
  page.evaluate(() => {
    const d = new Date()
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 12)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`
  })

export const todayInBrowser = (page: Page) =>
  page.evaluate(() => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  })

/** Makes the page believe the device has no WebGL at all, so every scene shows its 2D drawing. */
export async function disableWebGL(page: Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      if (/webgl/i.test(type)) return null
      return (original as (...args: unknown[]) => RenderingContext | null).call(this, type, ...rest)
    } as typeof HTMLCanvasElement.prototype.getContext
  })
}
