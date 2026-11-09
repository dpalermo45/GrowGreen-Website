# Source inventory

## Verified WordPress export counts

| Type | Count | Notes |
| --- | --- | --- |
| Published pages | **56** | Confirmed |
| Published posts | **8** | Confirmed |
| Attachment records | **303** | Status `inherit` (WordPress attachment model) |
| Attachments found in `website-media/uploads` | **303** | **0 missing** |

Media archive: `website-media.zip` preserved; extracted tree already present at `website-media/uploads` (years 2021–2026 + plugin folders). Do not blindly re-extract.

`form page code.txt` holds the November Facebook Divi `#gg-fb-estimate` module (form + Mapbox + CRM bridge fields). Astro recreates it as `FacebookNovemberLanding` posting to `/api/leads/website/`.

`careers page code.txt` holds the careers Divi `#gg-careers-v3` extract. Astro recreates it as `CareersLanding` with website proxies to CRM public careers openings/applications (never customer lead intake).

## Search Console indexing workbooks

Categories identified from each workbook **Metadata → Issue** (not filename suffixes):

| Category | File pattern |
| --- | --- |
| Coverage summary — all known pages | `Coverage-2026-11-05.xlsx` (non-drilldown) |
| Excluded by ‘noindex’ tag | Drilldown (1) — mostly WP feeds / wp-login |
| Blocked due to other 4xx issue | Drilldown (2) — wp-admin ajax / wp-json |
| Blocked due to access forbidden (403) | Drilldown (3) — Divi theme asset paths |
| Page with redirect | Drilldown (4) — `/privacy`, `/request-` |
| Alternate page with proper canonical tag | Drilldown (5) |
| Blocked by robots.txt | Drilldown (6) |
| Crawled - currently not indexed | Drilldown (7) |
| Discovered - currently not indexed | Drilldown (8) |
| Not found (404) | Drilldown (unsuffixed) |
| Search performance (Filters: Web, Last 16 months) | `Performance-on-Search-2026-11-05.xlsx` |

Not every excluded URL is an error. WP admin, feeds, and theme paths are intentionally not recreated.

## Performance top pages (verified)

Window per Filters sheet: Search type Web; Date **Last 16 months** (aligns with July 2025–Nov 2026 discussion).

| URL | Clicks |
| --- | --- |
| `/` | **583** |
| `/how-to-kill-pickers-stickers-burweed-in-louisiana/` | **408** |
| `/the-ultimate-guide-to-fertilizing-your-lawn-in-south-louisiana/` | **117** |
| `/contact-us/` | **59** |

## Design references

Six screenshots in `Design-References/` — current homepage/how-it-works inspiration plus competitor layout inspiration. Competitor copy/claims not used.
