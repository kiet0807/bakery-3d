import { cartCount, disableWebGL, expect, test } from './fixtures'

test.describe('vitrine', () => {
  // Six cakes under glass are drawn at about one frame per second by a software renderer (CI has no GPU),
  // which starves Playwright's checks. The controls tested here are the same with or without 3D, so they run
  // on the 2D drawing; a11y.spec.ts checks that the 3D vitrine itself renders without errors.
  test.beforeEach(async ({ page }) => disableWebGL(page))

  test('the list and the buttons choose the cake on show', async ({ page }) => {
    await page.goto('/menu')
    await expect(page.getByRole('heading', { level: 1, name: /6 mẫu bánh/ })).toBeVisible()
    const cakes = page.getByRole('radio')
    await expect(cakes).toHaveCount(6)
    await expect(page.getByRole('radio', { name: /Dâu Tây Mây Hồng/ })).toBeChecked()
    await expect(page.getByRole('heading', { level: 2, name: 'Dâu Tây Mây Hồng' })).toBeVisible()

    // Arrow keys move through the list like any radio group.
    await page.getByRole('radio', { name: /Dâu Tây Mây Hồng/ }).focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('radio', { name: /Socola Crush/ })).toBeChecked()
    const card = page.getByRole('region', { name: 'Socola Crush' })
    await expect(card).toBeVisible()
    await expect(card.getByText('520.000đ', { exact: true })).toBeVisible()
    await expect(card.getByText('Socola', { exact: true })).toBeVisible()
    await expect(card.getByText('18 cm · 6–8 người')).toBeVisible()
    await expect(card.getByText('trứng, sữa, bột mì (gluten), đậu nành', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Bánh tiếp theo' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Bento Bestie' })).toBeVisible()
    await page.getByRole('button', { name: 'Bánh trước' }).click()
    await page.getByRole('button', { name: 'Bánh trước' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Dâu Tây Mây Hồng' })).toBeVisible()
    // Round the table: before the first cake comes the last.
    await page.getByRole('button', { name: 'Bánh trước' }).click()
    await expect(page.getByRole('radio', { name: /Sinh Nhật Cầu Vồng/ })).toBeChecked()
    await expect(
      page.getByRole('region', { name: 'Sinh Nhật Cầu Vồng' }).getByText('“Happy Birthday”'),
    ).toBeVisible()
  })

  test('house cakes show how far ahead to order', async ({ page }) => {
    await page.goto('/menu')
    await expect(page.getByTestId('lead-time')).toHaveText(/Đặt trước 4 giờ/)
    await page.getByText('Vương Miện Caramel', { exact: true }).click()
    await expect(page.getByTestId('lead-time')).toHaveText(/Đặt trước 48 giờ/)
  })

  test('peeking inside is a toggle that resets with the next cake', async ({ page }) => {
    await page.goto('/menu')
    await page.getByRole('button', { name: 'Xem ruột bánh' }).click()
    await expect(page.getByRole('button', { name: 'Đóng lại' })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Bánh tiếp theo' }).click()
    await expect(page.getByRole('button', { name: 'Xem ruột bánh' })).toHaveAttribute('aria-pressed', 'false')
  })

  test('"Đổi theo ý bạn" opens the cake in the builder', async ({ page }) => {
    await page.goto('/menu')
    await page.getByText('Vương Miện Caramel', { exact: true }).click()
    const card = page.getByRole('region', { name: 'Vương Miện Caramel' })
    await expect(card.getByRole('link', { name: 'Đổi theo ý bạn' })).toHaveAttribute(
      'href',
      '/design?preset=caramel-crown',
    )
    await card.getByRole('link', { name: 'Đổi theo ý bạn' }).click()
    await expect(page).toHaveURL(/\/design$/)
    await expect(page.getByTestId('price')).toHaveText('1.290.000đ')
    await expect(page.getByRole('radio', { name: /^2 tầng/ })).toBeChecked()
  })

  test('a house cake goes straight into the cart', async ({ page }) => {
    await page.goto('/menu')
    await page.getByText('Khoai Môn Mộng Mơ', { exact: true }).click()
    const card = page.getByRole('region', { name: 'Khoai Môn Mộng Mơ' })
    await card.getByRole('button', { name: 'Thêm vào giỏ' }).click()
    await expect(cartCount(page)).toHaveText('1')
    await card.getByRole('link', { name: 'Xem giỏ →' }).click()
    await expect(page).toHaveURL(/\/cart$/)
    await expect(page.getByRole('heading', { name: 'Khoai Môn Mộng Mơ' })).toBeVisible()
  })

  test('the English vitrine keeps its links in English', async ({ page }) => {
    await page.goto('/en/menu')
    await expect(page.getByRole('heading', { level: 2, name: 'Strawberry Cloud' })).toBeVisible()
    const card = page.getByRole('region', { name: 'Strawberry Cloud' })
    await expect(card.getByText('350,000 VND', { exact: true })).toBeVisible()
    await expect(card.getByRole('link', { name: 'Make it yours' })).toHaveAttribute(
      'href',
      '/en/design?preset=strawberry-cloud',
    )
  })
})
