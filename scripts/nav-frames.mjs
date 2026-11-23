// Frame pacing while moving between the 3D pages by client navigation (the router, as a link click does), on an
// emulated phone (Pixel 7) or a desktop window, both with a 4x CPU slowdown. First each 3D page once, the way a
// visitor first meets it, then rounds of moving between pages already seen (Next.js keeps up to 3 visited routes
// alive, hidden). For each hop, over the 3 s after it: frames per second, the worst frame, frames longer than
// 100 ms, how long until the new stage's canvas is fully shown, and for how long a loading poster was on screen.
// At the end: WebGL contexts created over the whole walk (one is the page's WebGL check, given back at once) and
// how many are still alive.
//   node scripts/nav-frames.mjs <baseUrl> [phone|desktop] [rounds]
//   e.g. node scripts/nav-frames.mjs http://localhost:3216 phone 2
import { chromium, devices } from '@playwright/test'

const [base, kind = 'phone', roundsArg = '2'] = process.argv.slice(2)
const rounds = Number(roundsArg)
const WINDOW_MS = 3000
const HOPS = ['/design', '/menu', '/']

// Metal through ANGLE: the machine's own GPU. Without it Chromium draws WebGL in software (SwiftShader), which
// measures the CPU drawing pixels instead of the page.
const browser = await chromium.launch({ args: ['--use-angle=metal'] })
const context = await browser.newContext(
  kind === 'phone' ? { ...devices['Pixel 7'] } : { viewport: { width: 1440, height: 900 } },
)
const page = await context.newPage()
const cdp = await context.newCDPSession(page)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

await page.addInitScript(() => {
  try {
    sessionStorage.setItem('kais-bakery-intro-seen', '1')
    localStorage.setItem('kais-bakery-hint-drag', '1')
    localStorage.setItem('kais-bakery-hint-palette', '1')
  } catch {}
  const getContext = HTMLCanvasElement.prototype.getContext
  window.__contexts = { created: 0, lost: 0 }
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    const result = getContext.call(this, type, ...rest)
    if (/webgl/.test(type) && result && !this.__counted) {
      this.__counted = true
      window.__contexts.created += 1
      this.addEventListener('webglcontextlost', () => (window.__contexts.lost += 1))
    }
    return result
  }
  // How much of an element shows: hidden pages (display: none) not at all, else its opacity down the tree.
  const shown = (element) => {
    if (!element.checkVisibility()) return 0
    let opacity = 1
    for (let node = element; node; node = node.parentElement)
      opacity *= Number(getComputedStyle(node).opacity)
    return opacity
  }
  window.__shown = shown
  // Every frame: its time, and whether a loading poster shows in the page.
  window.__frames = []
  const tick = (time) => {
    let poster = false
    for (const element of document.querySelectorAll('main .bg-mint\\/45'))
      if (shown(element) > 0.05) poster = true
    window.__frames.push([time, poster])
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})

/** The label of the stage on screen (each scene has its own). */
const stageLabel = () =>
  page.evaluate(() => {
    for (const canvas of document.querySelectorAll('main canvas'))
      if (window.__shown(canvas) > 0) return canvas.closest('[role="img"]')?.getAttribute('aria-label') ?? ''
    return ''
  })

/** Waits until a stage other than `old` shows its canvas fully. */
async function waitForStage(old, timeout = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const done = await page.evaluate((old) => {
      for (const canvas of document.querySelectorAll('main canvas')) {
        const label = canvas.closest('[role="img"]')?.getAttribute('aria-label')
        if (label !== old && window.__shown(canvas) >= 0.999) return true
      }
      return false
    }, old)
    if (done) return
    await page.waitForTimeout(20)
  }
}

const rows = []
async function hop(path, group) {
  const from = new URL(page.url()).pathname
  await page.waitForTimeout(1500)
  const old = await stageLabel()
  const clicked = await page.evaluate((to) => {
    const now = performance.now()
    window.next.router.push(to)
    return now
  }, path)
  const started = Date.now()
  await page.waitForURL((url) => url.pathname === path)
  await waitForStage(old)
  const toStage = Date.now() - started
  const rest = WINDOW_MS - toStage
  if (rest > 0) await page.waitForTimeout(rest)
  const stats = await page.evaluate(
    ([since, span]) => {
      const frames = window.__frames.filter(([time]) => time >= since && time <= since + span)
      const gaps = []
      let poster = 0
      for (let i = 1; i < frames.length; i++) {
        const gap = frames[i][0] - frames[i - 1][0]
        gaps.push(gap)
        if (frames[i][1]) poster += gap
      }
      return {
        fps: (gaps.length / span) * 1000,
        worst: Math.max(...gaps),
        long: gaps.filter((gap) => gap > 100).length,
        poster,
      }
    },
    [clicked, WINDOW_MS],
  )
  rows.push({ ...stats, toStage, group })
  console.log(
    `${group.padEnd(6)} ${from.padEnd(8)} -> ${path.padEnd(8)} ${stats.fps.toFixed(1).padStart(5)} fps  worst ${String(
      Math.round(stats.worst),
    ).padStart(
      4,
    )} ms  >100ms ${stats.long}  stage in ${String(toStage).padStart(5)} ms  poster ${Math.round(stats.poster)} ms`,
  )
}

await page.goto(base + '/', { waitUntil: 'load' })
const renderer = await page.evaluate(() => {
  const gl = document.createElement('canvas').getContext('webgl2')
  const info = gl?.getExtension('WEBGL_debug_renderer_info')
  return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'unknown'
})
console.log(`${kind}, CPU 4x, ${renderer}`)
await waitForStage('')
await page.waitForTimeout(3000)
for (const path of HOPS) await hop(path, 'first')
for (let round = 0; round < rounds; round++) for (const path of HOPS) await hop(path, 'again')

for (const group of ['first', 'again']) {
  const some = rows.filter((row) => row.group === group)
  const mean = (key) => some.reduce((sum, row) => sum + row[key], 0) / some.length
  console.log(
    `mean ${group}: ${mean('fps').toFixed(1)} fps, worst ${Math.round(mean('worst'))} ms, >100ms ${mean('long').toFixed(1)}, stage in ${Math.round(mean('toStage'))} ms, poster ${Math.round(mean('poster'))} ms`,
  )
}
const contexts = await page.evaluate(() => window.__contexts)
console.log(`WebGL contexts: ${contexts.created} created, ${contexts.created - contexts.lost} alive`)
await browser.close()
