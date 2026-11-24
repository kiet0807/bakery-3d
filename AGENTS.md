<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md: Kai's Bakery (`bakery-3d`)

Single source of truth for AI coding agents working on this repo (Claude Code imports this file via `CLAUDE.md`; Codex and Antigravity read it directly).

## Overview

- Bilingual (Vietnamese default at `/`, English at `/en`) interactive 3D cake shop demo built with Next.js 16, React 19, Three.js / react-three-fiber, Tailwind CSS 4, TypeScript, and Lenis.
- Live site: `https://bakery.kaidev.io.vn` (auto-deploys on push to `main`).
- Kai's Bakery is a fictional showcase project — never wire real checkout/payments. Keep the demo-shop disclosures in exactly three places: the header chip (desktop), the phone menu, and checkout (the note by the form, the "Chốt đơn thử" button and the receipt). No tech lists or "not a real shop" banners elsewhere.

## Directory map

| Path | Contents |
| --- | --- |
| `src/app/[lang]` | App Router pages prerendered for `vi` and `en` |
| `src/proxy.ts` | Locale routing (`/menu` -> `/vi/menu`, `/vi/*` -> 308 without prefix) |
| `src/components/three` | Procedural 3D cake, studio/HDRI lighting, theme tokens, tweens, path tracer |
| `src/components` | Page UI, palette switcher, checkout flow, navigation |
| `src/i18n` | Typed dictionaries (`vi`, `en` typed from `vi`), `LocalLink`, `localeHref` |
| `src/lib` | Domain logic (`cake.ts`, `order.ts`, `palettes.ts`, `shop.ts`, `store.ts`) |
| `e2e/` | Playwright end-to-end and accessibility tests |
| `scripts/` | Screenshot, README shots, preset shots, and web-vitals scripts |

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev --port 3211` | Local dev server |
| `pnpm check` | Typecheck (`next typegen && tsc`), ESLint, Prettier, Vitest unit tests, production build |
| `pnpm e2e` | Playwright suite against built output (run `pnpm build` first) |
| `pnpm format` | Format with Prettier |

## Key invariants

- **Public repo:** Never commit secrets, personal credentials, or local working notes.
- **Commit and push:** Only commit or push when explicitly asked (`git push` deploys to production).
- **i18n:** Keep `en` dictionary keys in sync with `vi`. Internal same-locale links use `LocalLink` or `localeHref`; the VI/EN switcher stays a plain `<a>` tag (not Next `Link`) because the two locales use separate root layouts.
- **Palettes:** Keep `@theme` in `globals.css` equal to `PALETTES.g1` (default) and verify color contrast tests pass across all 4 palettes (`g1`, `b`, `g2`, `g3`).
- **3D rendering:** Scenes using `frameloop="demand"` (builder, vitrine) must call `invalidate()` on any visual change, and every new 3D animation must register with the canvas settler so snapshots/studio photos settle before capture.
- **Tailwind 4 transitions:** `translate-*`, `scale-*`, and `rotate-*` are separate CSS properties (not `transform`); list them explicitly in `transition-[...]` when animating.
