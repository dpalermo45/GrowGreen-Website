# Findings register — production audit 2026-11-09

Severity: critical > high > medium > low > info.

| ID | Severity | Evidence | Affected routes | Fix | Verification |
| --- | --- | --- | --- | --- | --- |
| F-01 | **high** (prod) | Capital-L legacy URL returns **404** on production Linux. Priority blog (GSC ~117 clicks). Canonical lowercase URL is **200**. | `/the-ultimate-guide-to-fertilizing-your-lawn-in-south-Louisiana/` | Local: `astro.config` redirect + middleware case map + SSR `404.astro` case-fold. | **Local fixed (pending deploy).** Prod still 404 until redeploy. Confirm 301 on Linux after deploy. |
| F-02 | **high** (prod) | Titles show `&amp;amp;` (double entity escape) and mojibake `â€“` for en-dash on some pages. | `/lawn-care-blog/`, `/services/`, `/fire-ant-treatments-baton-rouge/` (+ other content JSON with `&amp;`) | `normalizeSeoText()` in `BaseLayout` + `loadPageContent`; cleaned 21 content JSON SEO strings. | **Local dist verified** single `&amp;` / real `–`. Prod still old until redeploy. |
| F-03 | medium | Campaign landings were `index,follow` and listed in sitemap. | `/post-card-estimate-request/`, `/nextdoor-estimate-request/`, `/trucklead/` (Facebook/gym unchanged) | Set `noindex, follow` + sitemap exclusion for those three. | Fixed in close-out commit (verify after deploy). |
| F-04 | medium | Mobile topbar truncates “Serving South Louisiana” with ellipsis. | Global header | Allow wrap on narrow widths in `Header.astro`. | **Local CSS fixed** (pending deploy). |
| F-05 | medium | Manifest expects **410** for retired WP taxonomies/feeds; production returns **404**. | `/category/*`, `/feed/`, `/tag/*`, etc. | Optional dedicated 410 responses; 404 is acceptable if intentional. | Unchanged. |
| F-06 | low | GSC “review” URLs still 404 (never had retained pages). | `/estimate-request/`, `/reviews/`, `/fire-ant-control/`, `/lawn-care-baton-rouge/`, … | Keep as 404 unless owner maps redirects. Do **not** blanket-home. | Documented only. |
| F-07 | info | Google reviews SSR may paint fallback then hydrate from `/api/google-reviews/display/` (API healthy: 121 reviews @ 5.0). | Homepage reviews block | Optional: ensure cache available at SSR on host. | Prod API **PASS**; display recovers client-side. |
| F-08 | info | No GTM/GA4/Meta Pixel IDs installed (hooks only) — matches AGENTS.md. | Sitewide | Wire IDs when ready; fire conversions only after lead acceptance. | Inventory confirmed empty. |
| F-09 | info | Careers openings empty; application UI correctly disabled. | `/careers/`, `/api/careers/openings/` | CRM must post openings; not a website bug. | Prod openings `[]`, form disabled. |
| F-10 | blocker (process) | End-to-end live CRM lead proof not run (no authorized mutating test). | All lead forms | Owner-authorized office-aware smoke after deploy. | Non-mutating validation **PASS** (empty POST → 400 validation). |

## Closed as non-bugs

| Item | Result |
| --- | --- |
| `/google-reviews/setup/`, OAuth start | Public **404** (protected) |
| Portal link | `https://portal.growgreenweedcontrol.com/portal/` |
| www → apex, http → https | **301** |
| Broken internal links (full crawl) | **0** |
| Campaign offers postcard / Nextdoor / truck / Facebook | Match configured `$25` / `50%`+`$75` copy |
| Lead POST endpoint exists | Empty body → **400** validation (not false success) |
| Custom 404 | Soft HTML 404 with noindex |
