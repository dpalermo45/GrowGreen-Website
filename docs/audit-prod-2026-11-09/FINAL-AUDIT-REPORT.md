# Grow Green Weed Control — production readiness audit

**Date:** 2026-11-09  
**Production:** https://growgreenweedcontrol.com (Render + Cloudflare)  
**Repo:** GrowGreen-Website (`main`)  
**Claim level:** Evidence-based — **not** “100% bug-free.”

---

## Executive summary

Production is live and largely healthy: **138** inventory HTML routes crawled with **0** broken same-origin links/images; lead API rejects empty payloads correctly; reviews API serves real Google data; campaign offers match configured copy; portal points at the existing CRM portal.

Two **high** production defects were verified and **fixed locally** (pending deploy): (1) capital-`L` fertilizing-guide URL **404**, (2) double-escaped / mojibake SEO titles. Mobile topbar truncation also fixed locally.

Live CRM lead write + conversion proof remain **blocked** without office authorization. Local preview `.env` is in **live** CRM mode, so the mock-lead verify gate fails until preview is started with `GGWC_CRM_MODE=mock`.

---

## Coverage counts

| Metric | Count |
| --- | ---: |
| Inventory routes (all types) | **154** |
| Production sitemap URLs | **107** |
| HTML routes crawled on production | **138** |
| Broken same-origin links/images | **0** |
| Unit tests | **49 passed** |
| Production build (local after fixes) | **PASS** |
| Content scan issues | **1** (`/google-reviews/setup/` expected 404) |

### Inventory coverage & exclusions

- **Included:** homepage, quote/contact, all services & service areas, geo/parish hubs, blog posts, careers, privacy/terms, portal page, postcard/nextdoor/trucklead/Facebook/gym campaigns, thank-you utilities, APIs, setup/OAuth probes, legacy/GSC review URLs, 404 behavior, www/http.
- **Unverified / excluded from “pass” claims:** third-party social destination reachability; field CWV; authorized live CRM write; every interactive state on every page at desktop+mobile+tablet; Lighthouse on every URL (template medians only from prior lab).

---

## Confirmed production findings vs local fixes

| Finding | Production now | Local after this audit |
| --- | --- | --- |
| Capital-L fertilizing guide 404 | **FAIL** | Fixed (redirect + middleware + SSR 404) — **needs deploy** |
| `&amp;amp;` / mojibake titles | **FAIL** on affected pages | Fixed in dist HTML — **needs deploy** |
| Topbar ellipsis on narrow mobile | **FAIL** UX | CSS wrap fix — **needs deploy** |
| Lead API validation | **PASS** | PASS |
| Reviews display API | **PASS** | PASS |
| Internal link integrity | **PASS** | PASS |
| Setup/OAuth locked down | **PASS** (404) | PASS |
| Live CRM acceptance | **UNVERIFIED** | Mock unit tests PASS; local preview often live |

---

## Tests / build checks completed

- `npm test` → 49 passed (leads, reviews, service-areas, new `seo-text`)
- `npm run build` → PASS
- `BASE_URL=https://growgreenweedcontrol.com npm run launch:crawl` → 138 pages, 0 broken links
- `npm run launch:inventory` → 154 routes
- `npm run launch:content-scan` → 1 expected setup 404
- `npm run launch:verify` (local preview) → redirects/facts PASS; mock-lead FAIL while CRM mode is live
- Browser spot checks: home, quote, postcard, truck, nextdoor, careers, portal, mobile viewport

---

## Forms / CRM

See `FORM-CRM-MATRIX.md`. Non-mutating production proof only. No test leads submitted. CRM MCP knowledge tools were **not available** in this Cursor session; contract verification used `docs/integration-contract.md` + website unit tests + CRM-path documentation already in-repo.

---

## Remaining actions (priority)

1. **Deploy** current website fixes to production (SEO titles, Louisiana redirect stack, topbar CSS).
2. **Confirm on Linux prod** that `/the-ultimate-guide-to-fertilizing-your-lawn-in-south-Louisiana/` returns **301** → lowercase canonical.
3. **Authorized live CRM smoke** with office-approved inbox/phone; verify customer row + SMS consent false + attribution.
4. Owner decision: campaign pages **index** vs **noindex**.
5. Optional: return **410** for retired WP taxonomy/feed URLs instead of 404.
6. Re-run production crawl + Lighthouse after deploy; submit/monitor Search Console.
7. Wire analytics IDs only when ready (hooks exist; none installed).

---

## Artifact index

| Deliverable | Path |
| --- | --- |
| This report | `docs/audit-prod-2026-11-09/FINAL-AUDIT-REPORT.md` |
| Inventory | `docs/audit-prod-2026-11-09/INVENTORY.md` + `route-inventory.json` / `page-audit.csv` |
| Links/assets | `docs/audit-prod-2026-11-09/LINK-ASSET-AUDIT.md` + `link-audit.csv` |
| Findings | `docs/audit-prod-2026-11-09/FINDINGS.md` |
| Form/CRM matrix | `docs/audit-prod-2026-11-09/FORM-CRM-MATRIX.md` |
| Perf/a11y | `docs/audit-prod-2026-11-09/PERFORMANCE-A11Y.md` |
| Probes | `api-probes.json`, `seo-spotcheck.json`, `offer-copy.json`, `legacy-probes.json`, `analytics-inventory.json`, `portal-links.json` |

---

## External / tooling blockers

- No CRM ChatGPT MCP namespace connected in this session.
- No authorized production lead/application submission.
- Social network destination pages not fully fetched (rate/login walls → unverified, not marked broken).
- Lighthouse not re-batched on every production URL this pass.
