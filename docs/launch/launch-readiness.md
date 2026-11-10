# Launch readiness — Grow Green Weed Control website

**Audit date:** 2026-11-08 (local)  
**Recommendation:** **Local build ready; production verification pending.**

Critical product workflows work in local production preview. Deployment-dependent checks (KnownHost Node process, live CRM, HTTPS/DNS, indexing rebuild) remain owner/host steps. Do not treat this as “production live verified.”

---

## Coverage counts (evidence-based)

| Metric | Count | Evidence |
| --- | ---: | --- |
| Inventory routes (all types) | **148** | `docs/launch/route-inventory.json` |
| HTML routes crawled | **132** | `docs/launch/crawl-summary.json` |
| Broken same-origin links/images | **0** | `docs/launch/link-audit.csv` |
| Service-area targets audited | **45** | `docs/launch/service-area-audit.csv` |
| Content-scan issues | **0** / 107 pages | `docs/launch/content-scan.csv` |
| Launch verify gate | **20 PASS / 0 FAIL** | `docs/launch/verify-report.json` |
| Unit tests | **39 passed** | `npm test` |
| Production build | **PASS** | `npm run build` |
| Lighthouse mobile (3-run medians) | **PASS ≥90 Perf** on home/quote/service/area/blog | `docs/launch/performance-report.md` |

### Page audit matrix

Primary artifact: **`docs/launch/page-audit.csv`**.

| Bucket | Result |
| --- | --- |
| Marketing/static, services, service-areas, geo, blog, campaigns, legal | Crawl 200 + h1 where page |
| Redirect aliases | SSR 301 verified locally; edge map in `deploy/litespeed-redirects.conf` |
| API | Mock lead **PASS**; live CRM **BLOCKED** until host credentials |

---

## Closed in this “fix everything” pass

1. **Legacy redirects** — SSR 301 pages + `deploy/litespeed-redirects.conf` + systemd example.
2. **Launch verify gate** — `npm run launch:verify` (redirects, mock lead, noindex, facts).
3. **Campaign expiry** — November Facebook offers `expiresAt` end of Nov 2026 America/Chicago; offer UI hides when expired.
4. **Claims softening** — Live marketing no longer hard-asserts unverified “8 visits” / absolute no-contract wording; seasonal-visit / billing-options language pending owner confirm (`site.claimsNeedingVerification`).
5. **Content scan** — `npm run launch:content-scan` → 0 issues.
6. **Prod env checker** — `npm run launch:prod-env` / `launch:prod-env:strict`.
7. **LCP / Perf regression** — Split 11 dedicated service pages out of `[slug].astro` (was shipping ~313 KB unused CSS). Hero priorities tightened. Lab medians restored to ≥90 Perf / ~2.9 s LCP on key templates.
8. **Coverage copy** — 40 communities / 10 parishes helpers aligned sitewide.

---

## CRM / forms (local)

| Check | Result |
| --- | --- |
| `POST /api/leads/website` mock mode | **PASS** — `201`, `customer_id`, `mocked: true` |
| Promotional SMS + attribution mapping | **PASS** (unit) — first-class CRM fields; mock mode only locally |
| Live CRM on KnownHost | **BLOCKED** — controlled live test still required on host |
| Careers ≠ lead intake | Separated routes |
| Google reviews OAuth production | **BLOCKED** until host callback + tokens |

---

## SEO / indexing

| Check | Result |
| --- | --- |
| Local preview indexing | **false** → `noindex` / robots disallow (**PASS** for staging) |
| Production enable path | `PUBLIC_SITE_URL=https://growgreenweedcontrol.com` + `PUBLIC_SITE_INDEXING=true` **and rebuild/restart** |
| Prod env script | `npm run launch:prod-env:strict` fails correctly on local mock `.env` |

---

## Performance

See **`docs/launch/performance-report.md`**.

| Template | Perf median | LCP median |
| --- | ---: | ---: |
| Home | 94 | 2.93 s |
| Quote | 99 | 1.21 s |
| Lawn program | 95 | 2.86 s |
| Service area | 92 | 3.08 s |
| Priority blog | 95 | 2.86 s |

Field CWV: **untested**.

---

## Hosting

See **`docs/launch/hosting-knownhost.md`**, `deploy/litespeed-redirects.conf`, `deploy/growgreen-website.service`.

| Check | Result |
| --- | --- |
| Node standalone required | Confirmed |
| KnownHost process + LiteSpeed proxy | **BLOCKED** |
| HTTPS / apex-www | **BLOCKED** |
| Env secrets on host | **BLOCKED** |

---

## Still owner / host (cannot close in this repo alone)

1. Deploy Node process + LiteSpeed proxy + TLS.
2. Production `.env` with live CRM + indexing + Mapbox origin restriction.
3. One office-aware live CRM lead test.
4. Confirm whether to restore harder “8 visits” / contract claims after review.
5. Meta Pixel PageView via `PUBLIC_META_PIXEL_ID` (see `docs/meta-pixel.md`); GTM/GA4 still deferred.
6. Google reviews production OAuth + callback.
7. Search Console sitemap submit after indexing build.

---

## Publication checklist (exact)

1. `npm run launch:prod-env:strict` against production env file.
2. Rebuild with `PUBLIC_SITE_URL=https://growgreenweedcontrol.com`, `PUBLIC_SITE_INDEXING=true`, live CRM + Mapbox + reviews vars.
3. Deploy Node standalone; enable `deploy/growgreen-website.service` (or PM2 equivalent).
4. Install `deploy/litespeed-redirects.conf` on the edge; proxy to Node.
5. Smoke: `/`, `/request-a-quote/`, `/lawn-fertilization-weed-control/`, `/service-areas/`, pickers article, `/contact-us/`, `/about/`→301, unknown→404.
6. One **office-aware** live test lead; confirm CRM customer + no double messaging from website.
7. Confirm `robots.txt` allows crawl and `sitemap.xml` lists public URLs.
8. Submit sitemap in Search Console.
9. Re-run `npm run launch:crawl` and `npm run launch:lighthouse` against production URL.
10. Monitor 404s + CRM inbox 48h.

## Rollback

1. Re-point DNS/proxy to WordPress origin.
2. Keep Node host warm.
3. Export/list any leads captured only on the new stack.

---

## GO / NO-GO

| Decision | |
| --- | --- |
| **Unconditional GO for live DNS cutover** | **NO** — production host/CRM/indexing still pending |
| **Local production-preview build ready for owner review** | **YES** |
| **GO after production verification checklist** | **Conditional** |

**Final label:** `local build ready; production verification pending`
