import type { Page } from '@playwright/test'
import { normalizeConfig } from '../src/lib/cake'
import { encodeCake } from '../src/lib/share'
import { cartCount, clickInBand, expect, test } from './fixtures'

/** Clicks a choice card inside one section of the builder (the price breakdown repeats the names). */
const choose = (page: Page, section: string, choice: string) =>
  clickInBand(page.getByRole('group', { name: new RegExp(`^${section}`) }).getByText(choice, { exact: true }))

/** A radio or checkbox inside one section, by the start of its name. */
const option = (page: Page, section: string, role: 'radio' | 'checkbox', name: string) =>
  page
    .getByRole('group', { name: new RegExp(`^${section}`) })
    .getByRole(role, { name: new RegExp(`^${name}`) })

test.describe('cake builder', () => {
  test('every choice updates the price', async ({ page }) => {
    await page.goto('/design')
    const price = page.getByTestId('price')
    // The house cake: 16 cm, vanilla, strawberry jam, Đà Lạt strawberries and cream kisses.
    await expect(price).toHaveText('350.000đ')

    // 14 cm is in the small band: 250.000 + strawberries 30.000.
    await choose(page, 'Cỡ bánh', '14 cm')
    await expect(option(page, 'Cỡ bánh', 'radio', '14 cm')).toBeChecked()
    await expect(price).toHaveText('280.000đ')

    await choose(page, 'Cốt bánh', 'Socola')
    await expect(option(page, 'Cốt bánh', 'radio', 'Socola')).toBeChecked()
    await expect(price).toHaveText('280.000đ')

    await choose(page, 'Cốt bánh', 'Red velvet')
    await expect(price).toHaveText('300.000đ')

    await choose(page, 'Sốt chảy', 'Caramel')
    await expect(price).toHaveText('320.000đ')

    // Candles are free.
    await clickInBand(page.getByRole('button', { name: 'Thêm một cây nến' }))
    await clickInBand(page.getByRole('button', { name: 'Thêm một cây nến' }))
    await expect(page.locator('output')).toHaveText('2 nến')
    await expect(price).toHaveText('320.000đ')

    await clickInBand(page.getByRole('button', { name: 'Làm lại từ đầu' }))
    await expect(price).toHaveText('350.000đ')
  })

  test('no more than four toppings', async ({ page }) => {
    await page.goto('/design')
    await expect(page.getByText('Đã chọn 2/4')).toBeVisible()
    await choose(page, 'Trang trí', 'Macaron')
    await choose(page, 'Trang trí', 'Lá vàng ăn được')
    await expect(page.getByText('Đã chọn 4/4')).toBeVisible()
    await expect(page.getByTestId('price')).toHaveText('460.000đ')

    for (const name of ['Việt quất', 'Cherry', 'Socola miếng', 'Cốm cầu vồng']) {
      await expect(option(page, 'Trang trí', 'checkbox', name)).toBeDisabled()
    }
    await expect(option(page, 'Trang trí', 'checkbox', 'Macaron')).toBeChecked()

    await choose(page, 'Trang trí', 'Dâu tây Đà Lạt')
    await expect(page.getByText('Đã chọn 3/4')).toBeVisible()
    await expect(option(page, 'Trang trí', 'checkbox', 'Việt quất')).toBeEnabled()
  })

  test('the message keeps to letters and 22 characters, and costs nothing', async ({ page }) => {
    await page.goto('/design')
    const message = page.getByRole('textbox', { name: 'Chữ trên bánh' })
    await message.fill('Hi <Linh>@#2026!')
    await expect(message).toHaveValue('Hi Linh2026!')
    await expect(page.getByText('12/22')).toBeVisible()
    await expect(page.getByTestId('price')).toHaveText('350.000đ')

    await message.fill('Chúc mừng sinh nhật bé Na nhé')
    await expect(message).toHaveValue('Chúc mừng sinh nhật bé')
    await expect(page.getByText('22/22')).toBeVisible()
  })

  test('sweetness, lead time and allergens follow the cake', async ({ page }) => {
    await page.goto('/design')
    await expect(option(page, 'Độ ngọt', 'radio', 'Ít ngọt')).toBeChecked()
    // Unchanged house cake: four hours ahead.
    await expect(page.getByTestId('lead-time')).toHaveText(/Đặt trước 4 giờ/)
    await expect(page.getByTestId('allergens')).toHaveText('Có chứa: trứng, sữa, bột mì (gluten)')

    await choose(page, 'Độ ngọt', 'Ngọt vừa')
    await expect(page.getByTestId('lead-time')).toHaveText(/Đặt trước 24 giờ/)
    await expect(page.getByTestId('price')).toHaveText('350.000đ')

    await choose(page, 'Trang trí', 'Macaron')
    await expect(page.getByTestId('allergens')).toHaveText(/các loại hạt/)

    await choose(page, 'Cỡ bánh', '2 tầng')
    await expect(page.getByTestId('lead-time')).toHaveText(/Đặt trước 48 giờ/)
  })

  test('a vitrine cake opens from the address and the address is tidied', async ({ page }) => {
    await page.goto('/design?preset=choco-crush')
    await expect(page).toHaveURL(/\/design$/)
    await expect(page.getByTestId('price')).toHaveText('520.000đ')
    await expect(page.getByText('Socola Crush', { exact: true })).toBeVisible()
    await expect(option(page, 'Cốt bánh', 'radio', 'Socola')).toBeChecked()
    await expect(option(page, 'Nhân', 'radio', 'Ganache socola')).toBeChecked()
  })

  test('a shared design opens from its link', async ({ page }) => {
    const shared = normalizeConfig({
      size: 's20',
      sponge: 'matcha',
      filling: 'fresh-mango',
      frosting: 'pistachio',
      toppings: ['blueberries'],
      sweetness: 'regular',
      message: 'Mẹ yêu',
    })
    await page.goto(`/design?cake=${encodeCake(shared)}`)
    await expect(page).toHaveURL(/\/design$/)
    // 440.000 + matcha 30.000 + mango 50.000 + pistachio 40.000 + blueberries 60.000
    await expect(page.getByTestId('price')).toHaveText('620.000đ')
    await expect(page.getByRole('textbox', { name: 'Chữ trên bánh' })).toHaveValue('Mẹ yêu')
    await expect(option(page, 'Độ ngọt', 'radio', 'Ngọt vừa')).toBeChecked()
  })

  test('"Send this design to the shop" copies a link that rebuilds the cake', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/design')
    await choose(page, 'Cốt bánh', 'Khoai môn')
    await clickInBand(page.getByRole('button', { name: /Gửi thiết kế cho tiệm/ }))
    await expect(page.getByText('Đã chép link, dán vào Zalo cho tiệm nha!').first()).toBeVisible()
    const link = await page.evaluate(() => navigator.clipboard.readText())
    expect(link).toMatch(/\/design\?cake=[A-Za-z0-9_-]+$/)

    await clickInBand(page.getByRole('button', { name: 'Làm lại từ đầu' }))
    await expect(page.getByTestId('price')).toHaveText('350.000đ')
    await page.goto(link)
    await expect(option(page, 'Cốt bánh', 'radio', 'Khoai môn')).toBeChecked()
    await expect(page.getByTestId('price')).toHaveText('380.000đ')
  })

  test('slicing and adding to the cart', async ({ page }) => {
    await page.goto('/design')
    await page.getByRole('button', { name: 'Cắt bánh xem ruột' }).click()
    await expect(page.getByRole('button', { name: 'Ghép miếng bánh lại' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await expect(cartCount(page)).toHaveText('0')
    await page.getByRole('button', { name: 'Thêm vào giỏ' }).click()
    await expect(cartCount(page)).toHaveText('1')
    await expect(cartCount(page)).toHaveAttribute('aria-label', '1 bánh trong giỏ')
    await expect(page.getByRole('status').filter({ hasText: 'đã vào giỏ' })).toBeAttached()

    await page.getByRole('link', { name: 'Xem giỏ →' }).click()
    await expect(page).toHaveURL(/\/cart$/)
    await expect(page.getByRole('heading', { name: 'Dâu Tây Mây Hồng' })).toBeVisible()
  })

  test('the design survives a reload', async ({ page }) => {
    await page.goto('/design')
    await choose(page, 'Cốt bánh', 'Khoai môn')
    await expect(page.getByTestId('price')).toHaveText('380.000đ')
    await page.reload()
    await expect(option(page, 'Cốt bánh', 'radio', 'Khoai môn')).toBeChecked()
    await expect(page.getByTestId('price')).toHaveText('380.000đ')
  })

  test('the English builder speaks English and keeps prices in VND', async ({ page }) => {
    await page.goto('/en/design')
    await expect(page.getByRole('heading', { level: 1, name: /Design your own cake/ })).toBeVisible()
    await expect(page.getByTestId('price')).toHaveText('350,000 VND')
    await choose(page, 'Size', '14 cm')
    await expect(page.getByTestId('price')).toHaveText('280,000 VND')
    await expect(page.getByRole('button', { name: 'Add to cart' })).toBeVisible()
  })
})
