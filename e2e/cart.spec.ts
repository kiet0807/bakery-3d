import type { Page } from '@playwright/test'
import { CART_KEY, RAINBOW_BIRTHDAY, STRAWBERRY_CLOUD, cartCount, expect, seedCart, test } from './fixtures'

// 2 × 350.000đ + 455.000đ = 1.155.000đ: over 1.000.000đ, so the order takes a 50% deposit (578.000đ).
const TWO_LINES = [
  { id: 'line-strawberry', presetId: 'strawberry-cloud', quantity: 2, config: STRAWBERRY_CLOUD },
  { id: 'line-birthday', presetId: 'rainbow-birthday', quantity: 1, config: RAINBOW_BIRTHDAY },
]

/** The quick-pick days of the checkout's second step, as radios (the last one is "Ngày khác"). */
const dayChoices = (page: Page) => page.getByRole('group', { name: 'Ngày nhận' }).getByRole('radio')

/**
 * Picks the fourth quick day, as a person does, by its chip: at least three days after the earliest one offered,
 * so clear of every lead time (48 hours at most) whatever today is, with every slot of the day open. (Checking the
 * visually hidden radio itself makes Playwright click its 1-pixel spot, which can sit under the fixed header.)
 */
async function pickSafeDay(page: Page) {
  await page.getByRole('group', { name: 'Ngày nhận' }).locator('label').nth(3).click()
  await expect(dayChoices(page).nth(3)).toBeChecked()
}

test.describe('cart and test checkout', () => {
  test('a broken saved cart is dropped, not waited on forever', async ({ page }) => {
    await page.goto('/cart')
    await page.evaluate((key) => window.localStorage.setItem(key, '{'), CART_KEY)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'Giỏ còn trống trơn nè' })).toBeVisible()
    await expect(cartCount(page)).toHaveText('0')
  })

  test('an empty cart points to the builder and the menu', async ({ page }) => {
    await page.goto('/cart')
    await expect(page.getByRole('heading', { level: 1, name: 'Giỏ còn trống trơn nè' })).toBeVisible()
    const main = page.getByRole('main')
    await expect(main.getByRole('link', { name: 'Tự thiết kế bánh' })).toHaveAttribute('href', '/design')
    await expect(main.getByRole('link', { name: 'Xem menu bánh' })).toHaveAttribute('href', '/menu')
  })

  test('quantities and removing a cake', async ({ page }) => {
    await page.goto('/cart')
    await seedCart(page, TWO_LINES)
    await expect(page.getByRole('heading', { level: 1, name: /3 chiếc bánh/ })).toBeVisible()
    await expect(cartCount(page)).toHaveText('3')
    const order = page.getByRole('complementary', { name: 'Đơn hàng' })
    await expect(order.getByText('1.155.000đ').first()).toBeVisible()
    await expect(page.getByText('Có chứa: trứng, sữa, bột mì (gluten), các loại hạt')).toBeVisible()

    await page.getByRole('button', { name: 'Thêm một Sinh Nhật Cầu Vồng' }).click()
    await expect(cartCount(page)).toHaveText('4')
    await expect(order.getByText('1.610.000đ').first()).toBeVisible()

    await page.getByRole('button', { name: 'Bớt một Dâu Tây Mây Hồng' }).click()
    await expect(page.getByRole('button', { name: 'Bớt một Dâu Tây Mây Hồng' })).toBeDisabled()
    await expect(order.getByText('1.260.000đ').first()).toBeVisible()

    await page.getByRole('button', { name: 'Xóa Sinh Nhật Cầu Vồng' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Sinh Nhật Cầu Vồng' })).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1, name: /1 chiếc bánh/ })).toBeVisible()
    await expect(cartCount(page)).toHaveText('1')

    // The saved cart follows.
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: /1 chiếc bánh/ })).toBeVisible()
  })

  test('checkout comes in two steps that explain what is missing and focus it', async ({ page }) => {
    await page.goto('/cart')
    await seedCart(page, TWO_LINES)
    // The demo notice sits in the first step, where the name, phone and address are typed.
    await expect(page.getByText(/Tiệm không có thật nha: đây là đơn thử/)).toBeVisible()
    await expect(page.getByRole('heading', { level: 3, name: /Bước 1\/2/ })).toBeVisible()
    const next = page.getByRole('button', { name: /Tiếp tục: chọn ngày nhận/ })
    await next.click()

    // Step 1 checks only its own fields.
    const name = page.getByRole('textbox', { name: 'Tên người nhận' })
    await expect(name).toBeFocused()
    await expect(name).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByText('Cho tiệm xin tên người nhận nha.')).toBeVisible()
    await expect(page.getByText('Cho tiệm xin số điện thoại để gọi xác nhận nha.')).toBeVisible()
    await expect(page.getByText('Chọn ngày nhận bánh nha.')).toHaveCount(0)
    await expect(page.getByRole('status').filter({ hasText: 'Còn 2 ô cần sửa ở trên nha.' })).toBeVisible()

    // Errors follow the fields as they are fixed.
    await name.fill('L')
    await expect(page.getByText('Tên cần ít nhất 2 ký tự.')).toBeVisible()
    await name.fill('Linh')
    await expect(page.getByText('Tên cần ít nhất 2 ký tự.')).toHaveCount(0)

    const phone = page.getByRole('textbox', { name: 'Số điện thoại' })
    await phone.fill('12345')
    await expect(page.getByText(/Số này chưa đúng/)).toBeVisible()
    await next.click()
    await expect(phone).toBeFocused()
    await phone.fill('0347 551 122')

    // Delivery asks for an address; no payment card details are ever asked for.
    await page.getByText('Giao tận nơi', { exact: true }).click()
    await expect(page.getByRole('radio', { name: /Giao tận nơi/ })).toBeChecked()
    await expect(page.getByText('Giao tận nơi thì cần địa chỉ nha.')).toBeVisible()
    await next.click()
    const address = page.getByRole('textbox', { name: 'Địa chỉ giao' })
    await expect(address).toBeFocused()
    await address.fill('12 Võ Văn Ngân')
    // Enter moves on too.
    await address.press('Enter')

    // Step 2: its heading takes the focus; step 1 is summed up above.
    await expect(page.getByRole('heading', { level: 3, name: /Bước 2\/2/ })).toBeFocused()
    await expect(page.getByText('Giao tới 12 Võ Văn Ngân')).toBeVisible()
    await expect(page.getByText('Đơn này cần cọc vì đơn từ 1.000.000đ.')).toBeVisible()
    await expect(
      page.getByText('Một nửa đơn là 577.500đ, tiệm làm tròn lên nghìn thành 578.000đ cho chẵn nha.'),
    ).toBeVisible()
    await expect(page.getByRole('radio', { name: /Tiền mặt/ })).toBeDisabled()
    await expect(page.getByText(/Đơn thử thôi nha: bấm chốt là không gửi đi đâu/)).toBeVisible()

    const submit = page.getByRole('button', { name: /Chốt đơn thử/ })
    await submit.click()
    for (const text of ['Chọn ngày nhận bánh nha.', 'Chọn giờ nhận nha.', 'Chọn cách thanh toán nha.'])
      await expect(page.getByText(text)).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'Còn 3 ô cần sửa ở trên nha.' })).toBeVisible()

    // The days are one radio group: the focus lands on the first, arrow keys move along it.
    const days = dayChoices(page)
    await expect(days).toHaveCount(8)
    await expect(days.first()).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(days.nth(1)).toBeChecked()
    await expect(page.getByText('Chọn ngày nhận bánh nha.')).toHaveCount(0)

    // "Ngày khác" brings out a date field for later days; a day too soon is explained there.
    await page.getByText('Ngày khác', { exact: true }).click()
    const picker = page.getByLabel('Ngày bạn muốn nhận', { exact: true })
    await expect(picker).toBeFocused()
    await expect(picker).toHaveValue('')
    await picker.fill('2020-01-01')
    await expect(page.getByText(/Ngày này gấp quá/)).toBeVisible()
    // The error points at the earliest day, so that hint stays under it.
    await expect(page.getByText(/^Sớm nhất: /)).toBeVisible()
    await submit.click()
    await expect(picker).toBeFocused()

    // Back to step 1 keeps everything typed.
    await page.getByRole('button', { name: 'Sửa tên, số điện thoại và cách nhận' }).click()
    await expect(page.getByRole('heading', { level: 3, name: /Bước 1\/2/ })).toBeFocused()
    await expect(name).toHaveValue('Linh')
    await expect(address).toHaveValue('12 Võ Văn Ngân')
    await expect(page.getByLabel(/thẻ|card|cvc|expiry|email/i)).toHaveCount(0)
  })

  test('placing a test order boxes the cake and empties the cart', async ({ page }) => {
    await page.goto('/cart')
    await seedCart(page, TWO_LINES)
    await page.getByRole('textbox', { name: 'Tên người nhận' }).fill('  Linh  ')
    await page.getByRole('textbox', { name: 'Số điện thoại' }).fill('+84 347 551 122')
    await page.getByText('Giao tận nơi', { exact: true }).click()
    await page.getByRole('textbox', { name: 'Địa chỉ giao' }).fill('12 Võ Văn Ngân')
    await page.getByRole('button', { name: /Tiếp tục: chọn ngày nhận/ }).click()
    await expect(page.getByRole('heading', { level: 3, name: /Bước 2\/2/ })).toBeFocused()
    await pickSafeDay(page)
    // Delivery runs 8:00–21:30 (pickup follows the shop's 6:30–22:45).
    const time = page.getByLabel('Giờ nhận', { exact: true })
    await expect(time.locator('option').nth(1)).toHaveText('08:00')
    await expect(time.locator('option').last()).toHaveText('21:30')
    await time.selectOption('14:00')
    await page.getByText('MoMo', { exact: true }).click()
    await expect(page.getByRole('radio', { name: /^MoMo/ })).toBeChecked()
    await page.getByRole('button', { name: /Nhắn tiệm vài lời/ }).click()
    const note = page.getByRole('textbox', { name: /Nhắn tiệm/ })
    await expect(note).toBeFocused()
    await note.fill('Ít ngọt thêm xíu nha')
    await page.getByRole('button', { name: /Chốt đơn thử/ }).click()

    const heading = page.getByRole('heading', { level: 1, name: 'Đóng hộp xong, chờ ship tới nè!' })
    await expect(heading).toBeVisible()
    await expect(heading).toBeFocused()
    await expect(page.getByText(/^Đơn KAI-\d{4}$/)).toBeVisible()
    await expect(page.getByText(/3 chiếc bánh của Linh sẽ sẵn sàng lúc/)).toBeVisible()
    await expect(page.getByText('14:00', { exact: true })).toBeVisible()
    await expect(page.getByText('Giao tới: 12 Võ Văn Ngân.')).toBeVisible()
    await expect(page.getByText('Đơn thử thôi nha: không gửi đi đâu, không ai bị trừ tiền.')).toBeVisible()
    const receipt = page.getByRole('region', { name: 'Hóa đơn' })
    await expect(receipt.getByText('1.155.000đ')).toBeVisible()
    await expect(receipt.getByText('578.000đ')).toBeVisible()
    await expect(receipt.getByText('0347 551 122')).toBeVisible()
    await expect(cartCount(page)).toHaveText('0')
    const saved = await page.evaluate((key) => window.localStorage.getItem(key), CART_KEY)
    expect(JSON.parse(saved ?? '{}').state.items).toEqual([])

    await page.getByRole('link', { name: 'Quay lại menu' }).click()
    await expect(page).toHaveURL(/\/menu$/)
  })

  test('the cart speaks English under /en', async ({ page }) => {
    await page.goto('/en/cart')
    await seedCart(page, TWO_LINES)
    await expect(page.getByRole('heading', { level: 1, name: /3 cakes/ })).toBeVisible()
    await expect(page.getByRole('complementary').getByText('1,155,000 VND').first()).toBeVisible()
    await expect(page.getByText(/This shop isn't real: it's a test order/)).toBeVisible()
    await expect(page.getByRole('heading', { level: 3, name: /Step 1 of 2/ })).toBeVisible()
    await page.getByRole('button', { name: /Next: pick a day/ }).click()
    await expect(page.getByText('Add a name for the order.')).toBeVisible()
    await page.getByRole('textbox', { name: 'Name for the order' }).fill('Linh')
    await page.getByRole('textbox', { name: 'Phone number' }).fill('0347 551 122')
    await page.getByRole('button', { name: /Next: pick a day/ }).click()
    await expect(page.getByRole('heading', { level: 3, name: /Step 2 of 2/ })).toBeFocused()
    await expect(page.getByRole('button', { name: /Place test order/ })).toContainText('1,155,000 VND')
    await expect(
      page.getByText('Half the order is 577,500 VND; we round up to the next thousand, so 578,000 VND.'),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Add one more, why not' })).toHaveAttribute(
      'href',
      '/en/design',
    )
  })
})
