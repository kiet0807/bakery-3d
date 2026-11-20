import {
  RAINBOW_BIRTHDAY,
  CART_KEY,
  STRAWBERRY_CLOUD,
  cartCount,
  expect,
  seedCart,
  test,
  todayInBrowser,
  tomorrowInBrowser,
} from './fixtures'

const TWO_LINES = [
  { id: 'line-strawberry', presetId: 'strawberry-cloud', quantity: 2, config: STRAWBERRY_CLOUD },
  { id: 'line-birthday', presetId: 'rainbow-birthday', quantity: 1, config: RAINBOW_BIRTHDAY },
]

test.describe('cart and demo checkout', () => {
  test('an empty cart points to the builder and the vitrine', async ({ page }) => {
    await page.goto('/cart')
    await expect(page.getByRole('heading', { level: 1, name: 'Nothing in the box yet.' })).toBeVisible()
    await expect(page.getByRole('main').getByRole('link', { name: 'Build a cake' })).toHaveAttribute(
      'href',
      '/design',
    )
    await expect(page.getByRole('link', { name: 'Browse the vitrine' })).toHaveAttribute('href', '/menu')
  })

  test('quantities and removing a cake', async ({ page }) => {
    await page.goto('/cart')
    await seedCart(page, TWO_LINES)
    await expect(page.getByRole('heading', { level: 1, name: /3 cakes/ })).toBeVisible()
    await expect(cartCount(page)).toHaveText('3')
    const order = page.getByRole('complementary', { name: 'Order' })
    await expect(order.getByText('$170').first()).toBeVisible()

    await page.getByRole('button', { name: 'One more Birthday Confetti' }).click()
    await expect(cartCount(page)).toHaveText('4')
    await expect(order.getByRole('button', { name: /Place demo order/ })).toContainText('$234')

    await page.getByRole('button', { name: 'One fewer Strawberry Cloud' }).click()
    await expect(page.getByRole('button', { name: 'One fewer Strawberry Cloud' })).toBeDisabled()
    await expect(order.getByRole('button', { name: /Place demo order/ })).toContainText('$181')

    await page.getByRole('button', { name: 'Remove Birthday Confetti' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Sinh Nhật Cầu Vồng' })).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1, name: /1 cake/ })).toBeVisible()
    await expect(cartCount(page)).toHaveText('1')

    // The saved cart follows.
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: /1 cake/ })).toBeVisible()
  })

  test('checkout explains what is missing and focuses it', async ({ page }) => {
    await page.goto('/cart')
    await seedCart(page, TWO_LINES)
    await expect(page.getByText(/Demo checkout:/)).toBeVisible()
    const submit = page.getByRole('button', { name: /Place demo order/ })
    await submit.click()

    const name = page.getByRole('textbox', { name: 'Name on the order' })
    await expect(name).toBeFocused()
    await expect(name).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByText('Add a name for the order.')).toBeVisible()
    await expect(page.getByText('Choose a pickup day.')).toBeVisible()
    await expect(page.getByText('Choose a pickup time.')).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'Please check 3 fields above.' })).toBeVisible()

    // Errors follow the fields as they are fixed.
    await name.fill('L')
    await expect(page.getByText('Use at least 2 characters.')).toBeVisible()
    await name.fill('Linh')
    await expect(page.getByText('Use at least 2 characters.')).toHaveCount(0)

    await page.getByLabel('Pickup day').fill(await todayInBrowser(page))
    await expect(page.getByText('The earliest pickup is tomorrow.')).toBeVisible()
    await submit.click()
    await expect(page.getByLabel('Pickup day')).toBeFocused()

    // No payment details are ever asked for.
    await expect(page.getByLabel(/card|cvc|expiry|email|phone|address/i)).toHaveCount(0)
  })

  test('placing a demo order boxes the cake and empties the cart', async ({ page }) => {
    await page.goto('/cart')
    await seedCart(page, TWO_LINES)
    await page.getByRole('textbox', { name: 'Name on the order' }).fill('  Linh  ')
    await page.getByLabel('Pickup day').fill(await tomorrowInBrowser(page))
    await page.getByLabel('Pickup time').selectOption('14:00')
    await page.getByRole('textbox', { name: /Note for the baker/ }).fill('Less sweet, please.')
    await page.getByRole('button', { name: /Place demo order/ }).click()

    const heading = page.getByRole('heading', { level: 1, name: 'Boxed and ready.' })
    await expect(heading).toBeVisible()
    await expect(heading).toBeFocused()
    await expect(page.getByText(/^Order CC-\d{4}$/)).toBeVisible()
    await expect(page.getByText(/Your 3 cakes are waiting for Linh on/)).toBeVisible()
    await expect(page.getByText('14:00', { exact: true })).toBeVisible()
    await expect(page.getByText('This was a demo: nothing was sent and nothing was charged.')).toBeVisible()
    await expect(page.getByRole('region', { name: 'Receipt' }).getByText('$170')).toBeVisible()
    await expect(cartCount(page)).toHaveText('0')
    const saved = await page.evaluate((key) => window.localStorage.getItem(key), CART_KEY)
    expect(JSON.parse(saved ?? '{}').state.items).toEqual([])

    await page.getByRole('link', { name: 'Back to the vitrine' }).click()
    await expect(page).toHaveURL(/\/menu$/)
  })
})
