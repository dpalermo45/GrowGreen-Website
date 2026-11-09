# Launch performance report

**Scope:** local production preview (`http://127.0.0.1:4321`) only.  
**Not** field Core Web Vitals / CrUX / INP. Do not treat as production RUM.

## Launch-week lab (2026-11-08, post CSS split)

Source: `npm run launch:lighthouse` → `.lighthouse/launch-final/summary.json`  
Method: Lighthouse mobile, 3-run medians.

| Page | Perf (median) | LCP | CLS | Page weight |
| --- | ---: | ---: | ---: | ---: |
| `/` | 94 | 2.93 s | 0 | 331 KB |
| `/request-a-quote/` | 99 | 1.21 s | 0 | 144 KB |
| `/lawn-fertilization-weed-control/` | 95 | 2.86 s | 0 | 340 KB |
| `/service-areas/prairieville/` | 92 | 3.08 s | 0 | 594 KB |
| `/how-to-kill-pickers-stickers-burweed-in-louisiana/` | 95 | 2.86 s | 0 | 538 KB |

### What fixed the prior regression

An earlier launch-week pass scored service/blog ~78 Perf / ~4.5–4.7 s LCP because `[slug].astro` statically imported every dedicated service component, shipping a **~313 KB unused CSS** stylesheet on every slug page (including blogs).

**Fix:** dedicated page modules for the 11 heavy service/related landings (`src/pages/lawn-fertilization-weed-control.astro`, etc.) so Astro CSS-splits per route. LCP image priorities also tightened (hero ≤640 on mobile, logo/mascot no longer `fetchpriority=high` competing with LCP).

### Remaining lab notes

- Home / service / blog LCP ~2.9 s — slightly above the 2.5 s lab goal under simulated mobile; further gains need host-edge caching/CDN or higher-quality smaller source photos.
- Service-area pages carry gallery bytes (lazy-loaded) → higher total weight; Perf still ≥90 in this lab.

## Baseline evidence (prior lab, 2026-11-07)

Source: `docs/performance.md` — Lighthouse mobile, 3-run medians, label `.lighthouse/final`.

| Page | Perf (median) | LCP | CLS | Notes |
| --- | ---: | ---: | ---: | --- |
| `/` | 95 | 2.78 s | 0 | Slightly above 2.5 s LCP goal |
| `/request-a-quote/` | 99 | 1.06 s | 0 | |
| `/lawn-fertilization-weed-control/` | 95 | 2.78 s | 0 | Slightly above 2.5 s LCP goal |

## Optimizations in tree

Responsive WebP heroes/logos/mascots, self-hosted font, click-to-play video, reviews soft-refresh, `compressHTML`, Node adapter, dedicated service route CSS split, mobile-first hero `picture` / preload.

## Hosting impact (unmeasured)

Brotli/gzip, long-cache for `/_astro/*` `/images/*` `/fonts/*`, and CDN/edge caching on KnownHost/LiteSpeed are **BLOCKED** until production host is configured. Lab scores can change after edge caching.

## Verdict

| Claim | Status |
| --- | --- |
| Fresh launch-week Lighthouse suite complete | **PASS** |
| Key templates ≥90 Perf (lab median) | **PASS** |
| LCP ≤2.5 s lab goal on hero pages | **PARTIAL** (~2.9 s home/service/blog; quote OK) |
| Production field CWV | **NOT APPLICABLE / untested** |
