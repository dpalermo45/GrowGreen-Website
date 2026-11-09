# URL migration audit summary

Generated: 2026-11-08T02:09:40.473Z (reclassified with corrected new-route inventory)  
Live site verified: **Grow Green Weed Control**  
Canonical hostname: **`https://growgreenweedcontrol.com`** (apex HTTPS)

## Host observations

| Request | Status | Location |
| --- | --- | --- |
| `https://growgreenweedcontrol.com/` | 200 | — |
| `https://www.growgreenweedcontrol.com/` | 301 | https://growgreenweedcontrol.com/ |
| `http://growgreenweedcontrol.com/` | 301 | https://growgreenweedcontrol.com/ |

Server header observed: **LiteSpeed** (KnownHost). `www` and `http` both redirect to apex HTTPS.

**This audit does not claim complete URL discovery.** Orphans may remain in Search Console, ads, analytics, or server logs.

## Crawl scope

| Source | Result |
| --- | --- |
| robots.txt | Disallow `/wp-admin/` (allow admin-ajax); sitemaps `/sitemap.xml`, `/sitemap.rss` |
| Nested sitemaps | post, page, category, post_tag |
| Seed crawl | `/`, `/services/`, `/lawn-care-blog/`, `/about-us/`, `/contact-us/`, `/request-a-quote/` |
| Repo | `docs/url-migration-manifest.md` |
| Unique URLs probed | **161** |
| Rate limit | ~350 ms; UA `GrowGreenMigrationAudit/1.0` |
| Avoided | wp-admin/login, POSTs, endless query variants |

## New site inventory (local source of truth)

| Item | Count |
| --- | ---: |
| Implemented public paths (pages + data) | **106** |
| Trailing slash | Preferred; `trailingSlash: ignore` for OAuth callback exception |
| Configured site URL | `https://growgreenweedcontrol.com` |
| Pre-launch indexing | `noindex` until `PUBLIC_SITE_INDEXING=true` |
| Lead intake | `POST /api/leads/website` (replaces WP JSON bridge) |

Includes: core pages, services, related service pages, 40 `/service-areas/{city}/`, geo legacy paths, blog posts, campaign landings.

## Counts by classification

| Classification | Count |
| --- | ---: |
| PRESERVED | 64 |
| REDIRECT NEEDED | 11 |
| MISSING PAGE | 0 |
| INTENTIONAL REMOVAL | 51 |
| TECHNICAL/UTILITY | 35 |
| UNRESOLVED | 0 |
| **Total** | **161** |

## Highest-priority gaps

### MISSING PAGE (need content decision)

_None after reclassification._

### REDIRECT NEEDED (proposed single-hop 301)

Do **not** send these to the homepage. Preserve campaign/query params (`utm_*`, `gclid`, `fbclid`) when implementing on KnownHost/LiteSpeed — inspect actual rewrite config before choosing syntax.

- `/about/` → `/about-us/` — 301 /about/ → /about-us/ (high)
- `/contact/` → `/contact-us/` — 301 /contact/ → /contact-us/ (high)
- `/flower-bed-weed-control/` → `/flower-bed-weed-control-and-fertilization/` — 301 /flower-bed-weed-control/ → /flower-bed-weed-control-and-fertilization/ (high)
- `/lawn-treatment-denham-springs/` → `/service-areas/denham-springs/` — 301 to /service-areas/denham-springs/ after confirming intent (geo vs city hub) (medium)
- `/privacy/` → `/privacy-policy/` — 301 /privacy/ → /privacy-policy/ (high)
- `/request-/` → `/request-a-quote/` — 301 /request-/ → /request-a-quote/ (high)
- `/services/core-aeration/` → `/core-aeration/` — 301 /services/core-aeration/ → /core-aeration/ (high)
- `/services/fire-ant-treatment/` → `/fire-ant-treatment/` — 301 /services/fire-ant-treatment/ → /fire-ant-treatment/ (high)
- `/services/flower-bed-weed-control/` → `/flower-bed-weed-control-and-fertilization/` — 301 /services/flower-bed-weed-control/ → /flower-bed-weed-control-and-fertilization/ (high)
- `/services/lawn-fertilization-weed-control/` → `/lawn-fertilization-weed-control/` — 301 /services/lawn-fertilization-weed-control/ → /lawn-fertilization-weed-control/ (high)
- `/the-ultimate-guide-to-fertilizing-your-lawn-in-south-Louisiana/` → `/the-ultimate-guide-to-fertilizing-your-lawn-in-south-louisiana/` — 301 /the-ultimate-guide-to-fertilizing-your-lawn-in-south-Louisiana/ → /the-ultimate-guide-to-fertilizing-your-lawn-in-south-louisiana/ (high)

## PRESERVED

**64** URLs share the same path on the new site (services, many geos, blog posts, campaigns, hubs). Spot-check quote forms and attribution at cutover.

## INTENTIONAL REMOVAL / TECHNICAL

- Taxonomy `/category/*`, `/tag/*`: recommend **410** after owner confirmation (or 404 if no meaningful hits).
- Feeds, `xmlrpc.php`, `wp-admin`, `wp-json`: do not recreate; CRM uses website API.
- Date archives (`/2023/01/`): do not recreate.

## UNRESOLVED

_None_

## Launch blockers (owner / ops)

1. Confirm redirects for `/services/{service}/` aliases and short paths (`/about/`, `/flower-bed-weed-control/`).
2. Confirm whether legacy **fertilization/weed-control city** URLs 301 to `/service-areas/{city}/` or keep dedicated geo pages already in `geo-pages.generated`.
3. Confirm taxonomy 410 vs 404.
4. Implement redirects on **KnownHost/LiteSpeed** using the live vhost tools/`.htaccess`/app layer — do not assume plan features.
5. Keep indexing off until redirect + parity QA passes.
6. Later regression checks: preserved 200s; single-hop redirects; query passthrough; quote/CRM source fields; no loops.

## Limits

- Public sitemap + link + manifest crawl only.
- Title/canonical via HTML regex.
- No deployed-new-site headers measured (local inventory only).
- No traffic/revenue ranking claimed without GSC export attachment beyond existing manifest flags.

## MCP / Academy

Audit-only — **no MCP/Academy updates required** unless later redirect work changes CRM landing URLs or attribution contracts.

## Artifacts

- `docs/migration/url-audit.csv`
- `docs/migration/url-audit-summary.md`
- Cached probes: `.migration-work/` (gitignored)
