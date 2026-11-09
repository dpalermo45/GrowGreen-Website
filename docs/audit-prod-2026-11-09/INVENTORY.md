# Route / page inventory — production audit 2026-11-09

## Sources reconciled

| Source | Count / note |
| --- | --- |
| `npm run launch:inventory` | **154** routes (all types) |
| Production `sitemap.xml` | **107** URLs |
| Production HTML crawl (`launch:crawl`) | **138** paths checked |
| URL migration manifest | **138** recorded outcomes |
| WordPress export baseline | 56 pages + 8 posts (historical) |

## Classification summary

| Class | Approx. | Examples |
| --- | --- | --- |
| Public / indexable | ~100+ | Home, services, geo, blog, legal, service-areas |
| Campaign (indexable today) | 6 | postcard, nextdoor, trucklead, FB LPs, gym |
| Redirect | 24 | about→about-us, privacy, request-, services/*, etc. |
| Utility / noindex | thank-you*, `/test/` | Served 200 with noindex in source |
| Protected utility | `/google-reviews/setup/`, OAuth | Public **404** |
| API | 12 | leads, careers, google-reviews |
| Intentionally removed | WP categories/tags/feeds | Prod **404** (manifest preferred 410) |
| Unexpected / review | GSC orphans | Still 404 — not homepage-redirected |

## Production crawl histogram

| Status | Count |
| --- | ---: |
| 200 | 134 |
| 404 | 4 |

404 inventory hits: `/(astro-not-found)/` (probe), `/google-reviews/setup/` (protected), capital-L fertilizing guide ×2 (bug — F-01).

## Discovery coverage

- Sitemap URLs: all fetched in crawl targets via inventory.
- Campaign + utility routes included even when noindex.
- Legacy/manifest review URLs probed separately (`legacy-probes.json`).
- Orphan risk: capital-L alias 404 loses GSC equity until redirect ships.

Artifacts: `route-inventory.json`, `page-audit.csv`, `link-audit.csv`, `crawl-summary.json`, `critical-probes.csv`, `seo-spotcheck.json`, `legacy-probes.json`.
