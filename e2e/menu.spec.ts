import { cartCount, disableWebGL, expect, test } from './fixtures'

test.describe('vitrine', () => {
  // Six cakes under glass are drawn at about one frame per second by a software renderer (CI has no GPU),
  // which starves Playwright's checks. The controls tested here are the same with or without 3D, so they run
  // on the 2D drawing; a11y.spec.ts checks that the 3D vitrine itself renders without errors.
  test.beforeEach(async ({ page }) => disableWebGL(page))

  test('the list and the buttons choose the cake on show', async ({ page }) => {
    await page.goto('/menu')
    await expect(page.getByRole('heading', { level: 1, name: /Six house cakes/ })).toBeVisible()
    const cakes = page.getByRole('radio')
    await expect(cakes).toHaveCount(6)
    await expect(page.getByRole('radio', { name: /Strawberry Cloud/ })).toBeChecked()
    await expect(page.getByRole('heading', { level: 2, name: 'Strawberry Cloud' })).toBeVisible()

    // Arrow keys move through the list like any radio group.
    await page.getByRole('radio', { name: /Strawberry Cloud/ }).focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('radio', { name: /Midnight Ganache/ })).toBeChecked()
    const card = page.getByRole('region', { name: 'Midnight Ganache' })
    await expect(card).toBeVisible()
    await expect(card.getByText('$61', { exact: true })).toBeVisible()
    await expect(card.getByText('Dark cocoa', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Next cake' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Matcha Garden' })).toBeVisible()
    await page.getByRole('button', { name: 'Previous cake' }).click()
    await page.getByRole('button', { name: 'Previous cake' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Strawberry Cloud' })).toBeVisible()
    // Round the table: before the first cake comes the last.
    await page.getByRole('button', { name: 'Previous cake' }).click()
    await expect(page.getByRole('radio', { name: /Birthday Confetti/ })).toBeChecked()
    await expect(
      page.getByRole('region', { name: 'Birthday Confetti' }).getByText('“Happy Birthday”'),
    ).toBeVisible()
  })

  test('peeking inside is a toggle that resets with the next cake', async ({ page }) => {
    await page.goto('/menu')
    await page.getByRole('button', { name: 'Peek inside' }).click()
    await expect(page.getByRole('button', { name: 'Close it up' })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Next cake' }).click()
    await expect(page.getByRole('button', { name: 'Peek inside' })).toHaveAttribute('aria-pressed', 'false')
  })

  test('"Make it yours" opens the cake in the builder', async ({ page }) => {
    await page.goto('/menu')
    await page.getByText('Caramel Crown', { exact: true }).click()
    const card = page.getByRole('region', { name: 'Caramel Crown' })
    await expect(card.getByRole('link', { name: 'Make it yours' })).toHaveAttribute(
      'href',
      '/design?preset=caramel-crown',
    )
    await card.getByRole('link', { name: 'Make it yours' }).click()
    await expect(page).toHaveURL(/\/design$/)
    await expect(page.getByTestId('price')).toHaveText('$102')
    await expect(page.getByRole('radio', { name: /^Grand/ })).toBeChecked()
  })

  test('a house cake goes straight into the cart', async ({ page }) => {
    await page.goto('/menu')
    await page.getByText('Ube Dream', { exact: true }).click()
    const card = page.getByRole('region', { name: 'Ube Dream' })
    await card.getByRole('button', { name: 'Add to cart' }).click()
    await expect(cartCount(page)).toHaveText('1')
    await card.getByRole('link', { name: 'View cart →' }).click()
    await expect(page).toHaveURL(/\/cart$/)
    await expect(page.getByRole('heading', { level: 2, name: 'Ube Dream' })).toBeVisible()
  })
})
