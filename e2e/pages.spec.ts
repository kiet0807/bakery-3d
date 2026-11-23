import { expect, test } from './fixtures'

/**
 * The info pages (/about, /policies, /faq) in both languages: Vietnamese at `/…`, English at `/en/…`.
 * They have no 3D, so these tests are quick; the shared checks (one h1, title, skip link) live in a11y.spec.ts.
 */
const INFO = {
  '/about': { vi: 'Chào nha, mình là Kai.', en: "Hey there, I'm Kai." },
  '/policies': { vi: 'Mấy điều nên biết trước khi đặt.', en: 'The stuff to know before you order.' },
  '/faq': { vi: 'Hỏi gì tiệm cũng trả lời.', en: "Ask away, we've got answers." },
} as const

const LANGS = [
  { lang: 'vi', prefix: '', switchTo: 'Switch to English' },
  { lang: 'en', prefix: '/en', switchTo: 'Xem trang bằng tiếng Việt' },
] as const

test.describe('info pages', () => {
  for (const { lang, prefix } of LANGS) {
    for (const [path, titles] of Object.entries(INFO)) {
      test(`${prefix}${path} has its heading, language, canonical address and its twin`, async ({ page }) => {
        await page.goto(prefix + path)
        await expect(page.locator('html')).toHaveAttribute('lang', lang)
        await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(titles[lang])
        await expect(page).toHaveTitle(/Kai's Bakery$/)

        // Absolute addresses (metadataBase): Vietnamese has no prefix, and is also the default for other languages.
        const link = (selector: string) => page.locator(`link[${selector}]`)
        const at = (address: string) => new RegExp(`^https?://[^/]+${address}$`)
        await expect(link('rel="canonical"')).toHaveAttribute('href', at(prefix + path))
        await expect(link('hreflang="vi"')).toHaveAttribute('href', at(path))
        await expect(link('hreflang="en"')).toHaveAttribute('href', at(`/en${path}`))
        await expect(link('hreflang="x-default"')).toHaveAttribute('href', at(path))
        // Every page repeats that the shop is not real, in the footer.
        await expect(page.getByRole('contentinfo')).toContainText(
          lang === 'vi' ? /không có thật/ : /not a real/i,
        )
      })
    }
  }

  test('the language switch keeps the visitor on the same page', async ({ page }) => {
    await page.goto('/about')
    await page.getByRole('link', { name: LANGS[0].switchTo }).click()
    await expect(page).toHaveURL(/\/en\/about$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(INFO['/about'].en)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')

    await page.getByRole('link', { name: LANGS[1].switchTo }).click()
    // \/about$ would also match /en/about before the switch lands: wait for the exact path.
    await expect(page).toHaveURL((url) => url.pathname === '/about')
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(INFO['/about'].vi)
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
  })

  test('/vi/… redirects for good to the address without a prefix', async ({ page }) => {
    const response = await page.request.get('/vi/about', { maxRedirects: 0 })
    expect(response.status()).toBe(308)
    expect(response.headers().location).toMatch(/^(https?:\/\/[^/]+)?\/about$/)

    await page.goto('/vi/faq')
    expect(new URL(page.url()).pathname).toBe('/faq')
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
  })

  test('the about page says plainly that the shop is not real, and how to reach Kai', async ({ page }) => {
    await page.goto('/about')
    const project = page.getByRole('region', { name: 'Nói thật nè: tiệm không có thật đâu.' })
    await expect(project).toContainText(/không đơn nào được gửi đi/)
    await expect(project.getByRole('link', { name: 'Xem mã nguồn trên GitHub' })).toHaveAttribute(
      'href',
      /^https:\/\/github\.com\//,
    )
    await expect(page.getByRole('link', { name: '0347 551 122' }).first()).toHaveAttribute(
      'href',
      'tel:+84347551122',
    )
    await expect(page.getByRole('link', { name: 'Zalo' }).first()).toHaveAttribute(
      'href',
      /^https:\/\/zalo\.me\//,
    )

    // Links to #project land on the section itself.
    await page.goto('/en/about#project')
    await expect(page.getByRole('region', { name: /Real talk: this shop isn't real\./ })).toBeInViewport()
  })

  test('the policies page has a table of contents for its seven sections', async ({ page }) => {
    await page.goto('/policies')
    const toc = page.getByRole('navigation', { name: 'Trong trang này' })
    await expect(toc.getByRole('link')).toHaveCount(7)
    await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveCount(7)

    await toc.getByRole('link', { name: /Nguyên liệu và dị ứng/ }).click()
    await expect(page).toHaveURL(/#allergens$/)
    await expect(page.getByRole('heading', { level: 2, name: 'Nguyên liệu và dị ứng' })).toBeInViewport()

    // Lead times are a real table, with a header for each row.
    const table = page.getByRole('table')
    await expect(table.getByRole('columnheader')).toHaveText(['Loại đơn', 'Đặt trước ít nhất'])
    await expect(table.getByRole('rowheader', { name: 'Bánh 2 tầng' })).toBeAttached()
    await expect(page.getByRole('region', { name: 'Thanh toán và đặt cọc' })).toContainText('1.000.000đ')
  })

  test('FAQ answers open by mouse and keyboard, and link on', async ({ page }) => {
    await page.goto('/faq')
    const questions = page.locator('details > summary')
    await expect(questions).toHaveCount(13)

    const first = page.locator('details').filter({ hasText: 'Tiệm có thật không?' })
    const answer = first.getByText(/Hông nha/)
    await expect(answer).toBeHidden()
    await first.locator('summary').click()
    await expect(answer).toBeVisible()
    await expect(first.getByRole('link', { name: 'Đọc về dự án' })).toHaveAttribute('href', '/about#project')

    // The keyboard opens them too.
    const second = page.locator('details').nth(1)
    await second.locator('summary').focus()
    await page.keyboard.press('Enter')
    await expect(second).toHaveAttribute('open')

    await page.goto('/en/faq')
    const english = page.locator('details').filter({ hasText: 'Is the shop real?' })
    await english.locator('summary').click()
    await expect(english.getByRole('link', { name: 'Read about the project' })).toHaveAttribute(
      'href',
      '/en/about#project',
    )
  })

  test('an unknown address gets the bilingual 404 page', async ({ page, consoleErrors }) => {
    const response = await page.goto('/khong-co-trang-nay')
    expect(response?.status()).toBe(404)
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/bay màu/)
    await expect(page.getByRole('link', { name: 'Về trang chủ' })).toHaveAttribute('href', '/')
    await expect(page.locator('[lang="en"]').getByRole('heading', { level: 2 })).toBeVisible()
    // The browser logs the 404 status of the page itself; that one is the point of this test.
    for (let i = consoleErrors.length - 1; i >= 0; i--)
      if (/status of 404/.test(consoleErrors[i])) consoleErrors.splice(i, 1)
  })
})

test.describe('every page from a phone', () => {
  test('one button in the header lists the pages, and closes by itself', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Wide screens show the links in the header.')
    await page.goto('/faq')
    const button = page.getByRole('button', { name: 'Mở danh sách trang' })
    await expect(page.getByRole('banner').getByRole('link', { name: 'Tự thiết kế bánh' })).toBeHidden()
    await button.click()
    const pages = page.getByRole('banner').getByRole('link')
    for (const name of ['Tự thiết kế bánh', 'Menu bánh', 'Về tiệm', 'Chính sách', 'Hỏi đáp'])
      await expect(pages.filter({ hasText: name })).toBeVisible()
    await expect(pages.filter({ hasText: 'Hỏi đáp' })).toHaveAttribute('aria-current', 'page')
    // Whole on screen.
    const box = (await pages.filter({ hasText: 'Hỏi đáp' }).boundingBox())!
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width)

    // Esc closes it and gives the focus back.
    await page.keyboard.press('Escape')
    await expect(button).toBeFocused()
    await expect(pages.filter({ hasText: 'Tự thiết kế bánh' })).toBeHidden()

    await button.click()
    await pages.filter({ hasText: 'Tự thiết kế bánh' }).click()
    await expect(page).toHaveURL(/\/design$/)
    await expect(pages.filter({ hasText: 'Chính sách' })).toBeHidden()
  })
})
