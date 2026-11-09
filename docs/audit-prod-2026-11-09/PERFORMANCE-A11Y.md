# Performance & accessibility — 2026-11-09

## Scope honesty

- Full inventory HTTP crawl: **138** HTML routes (see `page-audit.csv`).
- Lighthouse lab runs in this pass: **not re-executed against every page**.
- Prior local lab medians (2026-11-08, `docs/launch/performance-report.md`) remain the template reference.
- Field Core Web Vitals: **unverified**.

## Prior lab medians (templates — not every URL)

| Template | Perf median | LCP median |
| --- | ---: | ---: |
| Home | 94 | 2.93 s |
| Quote | 99 | 1.21 s |
| Lawn program | 95 | 2.86 s |
| Service area | 92 | 3.08 s |
| Priority blog | 95 | 2.86 s |

## Practical page-weight notes (production)

- Shared Nunito Sans woff2 preloaded.
- Hero images use responsive `srcset` / WebP derivatives under `/images/`.
- Campaign landings and homepage quote form ship dedicated client JS chunks.
- Google reviews: client fetch to `/api/google-reviews/display/` when SSR cache empty.

## Accessibility spot checks (browser)

| Check | Result |
| --- | --- |
| Skip link present | PASS |
| Main landmarks / footer nav labels | PASS on sampled pages |
| Quote service checkboxes | Visually custom; native inputs opacity 0 inside labels (keyboard still toggles) |
| Careers empty state | Form disabled when no openings — PASS |
| Focus / Escape on mobile menu | Not exhaustively retested this pass |
| Topbar truncation at ~390px | **FAIL → fixed locally** (wrap instead of ellipsis) |
| Postcard/Nextdoor/truck hero text | Computed color white on dark hero — PASS (screenshot haze was misleading) |

## Recommended follow-up

1. Re-run `npm run launch:lighthouse` against production after deploy of SEO/redirect fixes.
2. Field CWV via Search Console / CrUX once indexing stabilizes.
3. Keyboard + screen-reader pass on quote multi-step and careers when openings return.
