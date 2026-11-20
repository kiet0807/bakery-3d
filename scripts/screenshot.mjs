// Takes screenshots of pages for review and for the README.
//   node scripts/screenshot.mjs <baseUrl> <outDir> <path>[@<width>x<height>][#<action>] ...
// Actions: "scroll=<px>" scrolls before the shot, "click=<css selector>" clicks first, "wait=<ms>" waits longer.
import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const [baseUrl = 'http://localhost:3000', outDir = 'screenshots', ...targets] = process.argv.slice(2)
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch({
  args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'],
})
for (const target of targets) {
  const [pathAndSize, ...actions] = target.split('#')
  const [path, size = '1440x900'] = pathAndSize.split('@')
  const [width, height] = size.split('x').map(Number)
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()))
  await page.goto(new URL(path, baseUrl).toString(), { waitUntil: 'load' })
  await page.waitForTimeout(2500)
  for (const action of actions) {
    const index = action.indexOf('=')
    const name = action.slice(0, index)
    const value = action.slice(index + 1)
    if (name === 'scroll') await page.mouse.wheel(0, Number(value))
    if (name === 'click') await page.click(value)
    if (name === 'wait') await page.waitForTimeout(Number(value))
    await page.waitForTimeout(900)
  }
  const file = `${outDir}/${path.replace(/[^a-z0-9]+/gi, '_') || 'home'}_${width}x${height}${actions.length ? '_' + actions.join('_').replace(/[^a-z0-9]+/gi, '-') : ''}.png`
  await page.screenshot({ path: file })
  console.log(file, errors.length ? `errors: ${errors.join(' | ').slice(0, 600)}` : 'ok')
  await page.close()
}
await browser.close()
