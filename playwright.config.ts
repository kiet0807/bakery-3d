import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests run against the production build: `pnpm build`, then `pnpm e2e`. Locally an app already
 * listening on PORT is reused (`PORT=3311 pnpm e2e`); in CI Playwright starts `next start` itself.
 * The 3D scenes run on the software renderer there (no GPU), so tests check the page, not the pixels.
 */
const port = Number(process.env.PORT ?? 3210)
const ci = Boolean(process.env.CI)

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  // Each page runs real-time 3D; two at a time keeps a laptop (or a CI runner) responsive.
  workers: ci ? 1 : 2,
  reporter: ci ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `pnpm start --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !ci,
    timeout: 120_000,
  },
})
