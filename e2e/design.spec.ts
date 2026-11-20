import type { Page } from '@playwright/test'
import { cartCount, clickInBand, expect, test } from './fixtures'

/** Clicks a choice card inside one section of the builder (the price breakdown repeats the names). */
const choose = (page: Page, section: string, choice: string) =>
  clickInBand(page.getByRole('group', { name: new RegExp(`^${section}`) }).getByText(choice, { exact: true }))

test.describe('cake builder', () => {
  test('every choice updates the price', async ({ page }) => {
    await page.goto('/design')
    const price = page.getByTestId('price')
    // The house cake: classic, vanilla, strawberry jam, strawberries and cream kisses.
    await expect(price).toHaveText('$53')

    await choose(page, 'Size', 'Mini')
    await expect(page.getByRole('radio', { name: /^Mini/ })).toBeChecked()
    await expect(price).toHaveText('$39')

    await choose(page, 'Sponge', 'Dark cocoa')
    await expect(page.getByRole('radio', { name: /^Dark cocoa/ })).toBeChecked()
    await expect(price).toHaveText('$42')

    await choose(page, 'Drip', 'Caramel')
    await expect(price).toHaveText('$46')

    await clickInBand(page.getByRole('button', { name: 'One candle more' }))
    await clickInBand(page.getByRole('button', { name: 'One candle more' }))
    await expect(page.locator('output')).toHaveText('2 candles')
    await expect(price).toHaveText('$48')

    await clickInBand(page.getByRole('button', { name: 'Start again from the house cake' }))
    await expect(price).toHaveText('$53')
  })

  test('no more than four toppings', async ({ page }) => {
    await page.goto('/design')
    await expect(page.getByText('2 of 4 chosen')).toBeVisible()
    await choose(page, 'Toppings', 'Macarons')
    await choose(page, 'Toppings', 'Gold leaf')
    await expect(page.getByText('4 of 4 chosen')).toBeVisible()
    await expect(page.getByTestId('price')).toHaveText('$70')

    for (const name of [/^Blueberries/, /^Cherries/, /^Chocolate shards/, /^Sprinkles/]) {
      await expect(page.getByRole('checkbox', { name })).toBeDisabled()
    }
    await expect(page.getByRole('checkbox', { name: /^Macarons/ })).toBeChecked()

    await choose(page, 'Toppings', 'Strawberries')
    await expect(page.getByText('3 of 4 chosen')).toBeVisible()
    await expect(page.getByRole('checkbox', { name: /^Blueberries/ })).toBeEnabled()
  })

  test('the message keeps to letters and 22 characters', async ({ page }) => {
    await page.goto('/design')
    const message = page.getByRole('textbox', { name: 'Message on the cake' })
    await message.fill('Hi <Linh>@#2026!')
    await expect(message).toHaveValue('Hi Linh2026!')
    await expect(page.getByText('12/22')).toBeVisible()
    await expect(page.getByTestId('price')).toHaveText('$56')

    await message.fill('Chúc mừng sinh nhật bé Na nhé')
    await expect(message).toHaveValue('Chúc mừng sinh nhật bé')
    await expect(page.getByText('22/22')).toBeVisible()

    await message.fill('')
    await expect(page.getByTestId('price')).toHaveText('$53')
  })

  test('a vitrine cake opens from the address and the address is tidied', async ({ page }) => {
    await page.goto('/design?preset=midnight-ganache')
    await expect(page).toHaveURL(/\/design$/)
    await expect(page.getByTestId('price')).toHaveText('$61')
    await expect(page.getByText('Midnight Ganache', { exact: true })).toBeVisible()
    await expect(page.getByRole('radio', { name: /^Dark cocoa/ })).toBeChecked()
    await expect(page.getByRole('radio', { name: /^Chocolate ganache/ })).toBeChecked()
  })

  test('slicing and adding to the cart', async ({ page }) => {
    await page.goto('/design')
    const slice = page.getByRole('button', { name: 'Slice it' })
    await slice.click()
    await expect(page.getByRole('button', { name: 'Put the slice back' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await expect(cartCount(page)).toHaveText('0')
    await page.getByRole('button', { name: 'Add to cart' }).click()
    await expect(cartCount(page)).toHaveText('1')
    await expect(cartCount(page)).toHaveAttribute('aria-label', '1 cake in the cart')
    await expect(page.getByRole('status').filter({ hasText: 'added to your cart' })).toBeAttached()

    await page.getByRole('link', { name: 'View cart →' }).click()
    await expect(page).toHaveURL(/\/cart$/)
    await expect(page.getByRole('heading', { level: 1, name: /1 cake/ })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Strawberry Cloud' })).toBeVisible()
  })

  test('the design survives a reload', async ({ page }) => {
    await page.goto('/design')
    await choose(page, 'Sponge', 'Ube')
    await expect(page.getByTestId('price')).toHaveText('$58')
    await page.reload()
    await expect(page.getByRole('radio', { name: /^Ube/ })).toBeChecked()
    await expect(page.getByTestId('price')).toHaveText('$58')
  })
})
