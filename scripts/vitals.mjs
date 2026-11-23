// Load metrics on an emulated mid-range phone (Lighthouse's mobile settings: 4x CPU slowdown, 150 ms RTT,
// 1.6 Mbps down), with Playwright's own Chromium. Not Lighthouse: FCP, LCP, CLS and a TBT estimate from long
// tasks, plus bytes over the wire. Median of N runs per page. Every run is a first visit (no cache, no storage).
// The long-task total also counts 3D frames longer than 50 ms, so on a scene that draws all the time it is higher
// than Lighthouse's TBT, which stops counting once the page goes quiet.
//   node scripts/vitals.mjs <baseUrl> <runs> <path> ...
//   e.g. node scripts/vitals.mjs https://bakery.kaidev.io.vn 3 / /design /menu /cart
import { chromium, devices } from '@playwright/test'
const [base, runsArg, ...paths] = process.argv.slice(2)
const runs = Number(runsArg ?? 3)
const browser = await chromium.launch()
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
for (const path of paths) {
  const rows = []
  for (let r = 0; r < runs; r++) {
    const context = await browser.newContext({ ...devices['Pixel 7'] })
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    })
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    let bytes = 0
    let jsBytes = 0
    const types = new Map()
    cdp.on('Network.responseReceived', (e) => types.set(e.requestId, e.type))
    cdp.on('Network.loadingFinished', (e) => {
      bytes += e.encodedDataLength
      if (types.get(e.requestId) === 'Script') jsBytes += e.encodedDataLength
    })
    await page.addInitScript(() => {
      window.__v = { lcp: 0, cls: 0, long: [] }
      new PerformanceObserver((l) => l.getEntries().forEach((e) => (window.__v.lcp = e.startTime))).observe({
        type: 'largest-contentful-paint',
        buffered: true,
      })
      new PerformanceObserver((l) =>
        l.getEntries().forEach((e) => {
          if (!e.hadRecentInput) window.__v.cls += e.value
        }),
      ).observe({ type: 'layout-shift', buffered: true })
      new PerformanceObserver((l) =>
        l.getEntries().forEach((e) => window.__v.long.push([e.startTime, e.duration])),
      ).observe({ type: 'longtask', buffered: true })
    })
    const t0 = Date.now()
    await page.goto(base + path, { waitUntil: 'load', timeout: 120000 })
    const loadMs = Date.now() - t0
    await page.waitForTimeout(8000)
    const v = await page.evaluate(() => {
      const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0
      const tbt = window.__v.long
        .filter(([s]) => s >= fcp)
        .reduce((sum, [, d]) => sum + Math.max(0, d - 50), 0)
      return { fcp, lcp: window.__v.lcp, cls: window.__v.cls, tbt }
    })
    rows.push({ ...v, loadMs, kb: bytes / 1024, jsKb: jsBytes / 1024 })
    await context.close()
  }
  const m = (k) => median(rows.map((x) => x[k]))
  console.log(
    `${path.padEnd(10)} FCP ${(m('fcp') / 1000).toFixed(1)}s  LCP ${(m('lcp') / 1000).toFixed(1)}s  TBT~ ${Math.round(m('tbt'))}ms  CLS ${m('cls').toFixed(3)}  load ${(m('loadMs') / 1000).toFixed(1)}s  ${Math.round(m('kb'))} KB (JS ${Math.round(m('jsKb'))} KB)`,
  )
}
await browser.close()
