# Website performance (mobile lab)

Lab evidence for the Grow Green Weed Control Astro site. **Not** field Core Web Vitals / INP. Do not treat these numbers as production RUM.

## Stack (inspected)

| Item | Value |
| --- | --- |
| Framework | Astro 5 (hybrid) |
| Adapter | `@astrojs/node` standalone |
| Output | `output: "server"` with `prerender = true` on marketing pages |
| HTML | `compressHTML: true` |
| Tracking | `dataLayer` / `ggwcTrack`; Meta Pixel PageView when `PUBLIC_META_PIXEL_ID` is set (disabled locally) |
| Hosting | Not deployed from this repo yet (see `docs/open-questions.md`) |

## How to re-test (local production preview)

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4321
node scripts/lighthouse-batch.mjs <label> .lighthouse/<label>
```

Conditions used for the 2026-11-07 audit:

- Lighthouse 13.x via `npx lighthouse`
- `--form-factor=mobile`, simulated throttling
- 3 runs per URL; **medians** reported
- URLs: `/`, `/request-a-quote/`, `/lawn-fertilization-weed-control/`
- Target host: `http://127.0.0.1:4321` (local preview only)
- **No deployed URL measured** in this pass

## Median mobile results (local preview)

### Before (`\.lighthouse\baseline`)

| Page | Perf | LCP | CLS | TBT | Page weight | JS weight |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Home `/` | 74 | 11.9 s | 0 | 0 ms | 2207 KB | 5 KB |
| Quote `/request-a-quote/` | 99 | 1.6 s | 0.005 | 0 ms | 402 KB | 7 KB |
| Service `/lawn-fertilization-weed-control/` | 74 | 8.3 s | 0 | 0 ms | 1393 KB | 5 KB |

### After (`\.lighthouse\final`)

| Page | Perf | LCP | CLS | TBT | Page weight | JS weight |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Home `/` | **95** | **2.78 s** | 0 | 0 ms | **315 KB** | 5 KB |
| Quote `/request-a-quote/` | **99** | **1.06 s** | 0 | 122 ms | **131 KB** | 7 KB |
| Service `/lawn-fertilization-weed-control/` | **95** | **2.78 s** | 0 | 0 ms | **338 KB** | 5 KB |

### Delta (home)

| Metric | Before | After |
| --- | ---: | ---: |
| Performance | 74 | 95 |
| LCP | 11.9 s | 2.78 s |
| Transfer weight | 2207 KB | 315 KB |

## Changes made

1. **Logo** — 1024² PNG (~276 KB) → responsive WebP (`logo-64/128/192.webp`); header uses `srcset` + `fetchpriority="high"`.
2. **Hero lawn** — 1920 WebP (~782 KB) → 640/960/1280/1600 ladder; CSS `background-image` breakpoints for homepage; `<picture>` for lawn service hero; mobile preload of 640 only.
3. **Mascot** — backpack PNG (~855 KB) → 216/320/480 WebP; other ATF mascots get `-240.webp` derivatives on contact/service-area pages.
4. **Video poster** — constrained `srcset` (480/640) so mobile does not pull the full 1080 asset; click-to-play video unchanged (no auto-download of the ~18 MB MP4).
5. **Fonts** — removed render-blocking Google Fonts CSS; self-hosted `public/fonts/nunito-sans-latin.woff2` with `font-display: swap` + preload.
6. **Google reviews client fetch** — when SSR already painted reviews, skip immediate refetch; soft-refresh only after a hidden→visible tab cycle (preserves expand UI + fallback path).
7. **No new optimization packages**; CRM quote form / lead payload / tracking hooks unchanged.

## Checks passed

- `npm test` — 39 tests passed (leads, service-areas, google-reviews)
- `npm run build` — success
- Production preview Lighthouse suite — see tables above
- Forms / CRM bridge — not exercised with live leads (per policy); unit tests cover lead transforms

## Remaining bottlenecks / assumptions

| Item | Notes |
| --- | --- |
| Lab LCP ~2.8 s on home/service | Slightly above the 2.5 s lab goal under simulated mobile; further gains need higher-quality source photos or host-edge caching/CDN |
| Unused CSS on service page | Shared Astro CSS chunks (~40 KB potential); splitting further risks maintenance cost |
| Hosting compression / cache headers | **Not measured** — Node preview is not CDN; enable Brotli/gzip + long-cache for `/_astro/*`, `/images/*`, `/fonts/*` on the eventual host |
| Field CWV / INP | **No CrUX/RUM data** in this pass — do not claim production passes |
| Deployed URLs | **Not tested** — distinguish future production runs from this local preview |
| Video file size | `public/videos/dereck-intro.mp4` remains large; OK while click-to-play, but re-encode if autoplay is ever added |
| Core aeration video | `public/videos/core-aeration.mp4` web-encoded ~6 MB (720×900, CRF 30, `faststart`); `preload=metadata` + WebP poster; do not autoplay |
| MCP/Academy docs | No CRM contract or workflow changes — **no MCP/Academy updates required** |

## Maintenance

- Prefer WebP (and AVIF when already curated) under `public/images/`; keep explicit `width`/`height`.
- Never lazy-load the LCP image; preload only the mobile-sized primary asset.
- Re-run `node scripts/lighthouse-batch.mjs` after major homepage/hero/font changes.
- Keep analytics IDs deferred until consent/GTM wiring is intentional; do not double-fire conversion events.
