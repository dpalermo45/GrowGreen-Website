# Test results & launch blockers

## Automated (local)

| Suite | Result | Notes |
| --- | --- | --- |
| `tests/leads.test.ts` (Vitest) | **25/25 passed** (suite **45/45**) | Mapping, promotional SMS checked/unchecked (no inference), attribution field mapping, lead_source preservation, honeypot, validation, null customer_id rejection, bare 200 rejection, upstream errors, mock success, missing live config, timeout, idempotency + consent/attribution upstream body, rate limit, conversion gate |
| `tests/google-reviews.test.ts` (Vitest) | **16/16 passed** | OAuth state/PKCE, token refresh, pagination + Google averageRating accuracy, cache soft/hard expiry, setup-route protection, unavailable fallback, no auto location pick, plain-text review mapping |
| `npm test` (all) | **35/35 passed** | Leads 19 + Google reviews 16 |
| `npm run build` | **Passed** | After content-gap closure pass |
| Stored content parity (`scripts/compare_stored_vs_local.py`) | **54 strong / 2 partial / 1 weak** (was 17/26/4/10) | Hubs, 9 services, geo, careers, campaigns closed; privacy/terms use generated legal HTML (not Divi JSON); trucklead “misses” are form chrome intentionally omitted |

## Homepage recording polish pass (2026-11-06)

| Check | Result |
| --- | --- |
| Section flow | **Pass** — hero estimate → owner intro → how it works → 8-visit program → 9 services + area chips → benefits (truck photo) → compact Google reviews → final estimate CTA |
| Owner photo repetition | **Pass** — Dereck/truck video kept in intro only; benefits section uses truck-and-trailer work photo |
| Mid-page CTA banners | **Pass** — removed process mid-CTA and program mid-CTA; quote actions remain at hero, benefits, and final banner |
| Popular service areas | **Pass** — Tree & Shrub removed; 8 confirmed location chips + View all; Tree & Shrub stays in services nav/grid |
| Service grid | **Pass** — all 9 categories; core and liquid aeration separate cards/links; 3-col desktop / 2-col tablet / 1-col mobile |
| Eight-treatment graphic | **Pass** — labeled round list from lawn-program source (month windows + titles); honest “about every 6 weeks / may shift” copy; no rigid identical-product promise |
| “24 hours” claim | **Pass** — replaced with “Get your free, personalized lawn estimate”; hours noted for call/text |
| Negative comparison copy | **Pass** — removed franchise/mowing/stock-photo phrasing from homepage + footer brand blurb |
| Text Us | **Pass** — `sms:+12254613199` (public number); copy ties to office hours |
| Reviews pending state | **Pass** — compact Google link only; no stars/carousel/placeholder reviews |
| Footer areas | **Pass** — chip wrapping + “View all 40 areas”; full list remains on `/service-areas/` |
| Form step 1→2 / Back | **Pass** — values retained; Back present on step 2 |
| Lead regression | **Pass** — `npm test` 19/19 |
| Build | **Pass** |
| Viewports overflow | **Pass** — CDP 360 / 390(approx) / 768 / 1024 / 1440: no horizontal overflow |
| Attached recording | **Unavailable in workspace assets** — polish followed the written brief |
| Reduced-motion audit | **Not fully instrumented** — no new decorative motion libraries added |

## Visual polish verification (2026-11-06)

| Check | Result |
| --- | --- |
| Hero form label/price contrast | **Pass** — scoped `.quote-form` / `.form-panel` foregrounds; CDP contrast: labels **15.37:1**, price banner **13.65:1**, inputs **16.46:1** (WCAG AA) |
| Persistent visible labels | **Pass** — Service address, City, ZIP, name, email, phone, notes, consent |
| Typography | **Pass** — Nunito Sans display+body; Fraunces serif removed |
| Homepage hierarchy | **Pass** — eyebrow “South Louisiana Lawn Treatment Specialists”; single H1; no redundant company name heading |
| Compact header | **Pass** — utility topbar scrolls away; sticky main nav only; solid `#ffffff` background (`opacity: 1`); ~75px height; current Full-Glow `logo.png` (not early `logo-words`); collapses ≤1100px with Menu + keyboard Esc/outside close |
| Header bleed-through | **Pass (CDP)** — scrolled stack samples show opaque `rgb(255,255,255)` `.site-header` above hero content; no opacity on header container. Root cause of oversized/ghosting look was square `logo.png` expanding sticky height (~128px) before height constraint / wordmark swap |
| Service cards | **Pass** — image-led treatments for all 9 categories; tighter title→description spacing; fungus/mosquito assets swapped off stylized/non-brand photography |
| Footer logo colors | **Pass** — original wordmark on compact white plate; CSS invert removed; copyright no longer repeats starting price |
| Pricing language | **Pass** — starting price shown in form banner / CTA; hero sub no longer repeats the same price sentence |
| Customer copy | **Pass** — homepage lead “Explore lawn treatments…”; negative mowing/franchise promo phrasing removed from Astro surfaces + rendered content fields |
| Form step 1 → 2 | **Pass** — Continue full-width; Back on step 2; fields preserve values |
| Mock lead submit | **Pass** — mock acceptance path; mock message identifies non-CRM delivery |
| Lead regression suite | Unchanged contracts; still green |

Viewport checks with browser tooling + CDP: **360/390** (Menu), **768**, **1024**, **1440** (desktop nav). Scrolled sticky header inspected; no horizontal overflow at 1440.

## Request a Quote (Divi V15 → Astro)

| Check | Status |
| --- | --- |
| `/request-a-quote/` | **Pass** — `RequestQuotePage` three-step form |
| Lead endpoint | Browser posts to `/api/leads/website/` (not WP JSON) |
| CRM `lead_source` | Preserved: `Request an Estimate` |
| Acceptance gate | Requires `ok` + non-null `customer_id` |
| Claims | Scrubbed unverified 600+ / 4.9★ / franchise stats; uses confirmed $39/mo + local identity |
| Mapbox | Geocoding v6 via `PUBLIC_MAPBOX_TOKEN`; manual city/ZIP always allowed |
| FAQ schema | FAQPage JSON-LD present |
| Build + unit tests | **Pass** (35) |

## Facebook November landing (Divi → Astro)

| Check | Status |
| --- | --- |
| `form page code.txt` | **Saved** — live Divi `#gg-fb-estimate` module (~60 KB) |
| Campaign URLs | `/request-an-estimate-facebook-50/` and `/facebook-estimate-request/` use `FacebookNovemberLanding` |
| Lead endpoint | Browser posts to `/api/leads/website/` (not WP JSON) |
| CRM strings | Exact Divi `lead_source` / promotion / service / notes / UTM / fbclid / honeypot / idempotency |
| Acceptance gate | Requires `ok` + non-null `customer_id` (no success on bare 200) |
| Meta Pixel | Fires `Lead` only when acceptance is **not** mocked |
| Mapbox | Uses `PUBLIC_MAPBOX_TOKEN` from env (manual entry always allowed) |
| Mock POST `/api/leads/website/` | **Pass** — 201 `{ ok, customer_id, mocked: true }` with Facebook lead_source strings |
| Preview `/request-an-estimate-facebook-50/` | **Pass** — form present; site chrome hidden |

## Manual / still needed at launch

| Check | Status |
| --- | --- |
| Local preview homepage + forms | Preview server on **:4321** |
| Live CRM E2E lead | **Blocked** — no credentials; mock only |
| Mapbox autocomplete | Local token set; confirm production-restricted token |
| Analytics / Pixel conversion | Hooks present; Pixel Lead gated to non-mock acceptance |
| Careers hiring APIs | Mock openings + JSON applications via `/api/careers/*` (not lead intake); mock apply **201**; live CRM openings currently empty |
| Production indexing | Intentionally off (`PUBLIC_SITE_INDEXING=false`) |

## Remaining launch blockers

1. CRM base URL + API key for controlled live verification  
2. Owner verification of flagged claims (ratings, lawn counts, guarantees, contract language)  
3. Campaign expiration confirmation for Facebook 50% offer  
4. Hosting target + DNS/SSL cutover plan  
5. Tracking IDs (GTM/GA/Meta) if required at launch  
6. Map token for autocomplete  
7. Confirm careers application destination email/tool  

## Google reviews integration (implementation)

| Check | Result |
| --- | --- |
| Isolation | Website OAuth client + `.data/google-reviews/` only; CRM client/tokens untouched |
| Callback | `/api/google-reviews/callback` registered URI; PKCE + state; loopback/setup-token gated |
| Location pick | Owner must confirm; first API result never auto-selected |
| Cache policy | Soft TTL + ≤30-day hard max; disconnect clears tokens/cache |
| Display | `GoogleReviews` on homepage + lawn page; Google avg/count; sample `updateTime desc`; fallback link |
| Live connection | **Not verified until owner completes local OAuth** |

## Lawn fertilization page polish (Divi → Astro)

| Check | Result |
| --- | --- |
| Route | `/lawn-fertilization-weed-control/` uses dedicated `LawnFertilizationPage` (not generic `ServicePageView`) |
| Sections | Hero, trust strip, owner video, local features, 8-round seasons, pricing + planning estimator, process, QuoteForm, Google reviews link, FAQ, final CTA, mobile sticky bar |
| Claims scrub | **Pass** — omitted 600+, 4.9★, satisfaction guarantee, named testimonial quotes; reviews CTA links to Google only |
| Lead path | Shared `QuoteForm` → `/api/leads/website/`; estimator selection appended via `data-extra-notes` |
| Media | Local `/images/home/hero-lawn.webp`, `/videos/dereck-intro.mp4`, site chrome/mascot assets |
| Structured data | Service + FAQPage JSON-LD retained |
| Build / leads tests | **Pass** — `npm run build`; Vitest 19/19 |

## Blog post CTA (soft conversion)

| Check | Result |
| --- | --- |
| Sticky full QuoteForm removed | **Pass** — blog aside no longer embeds `QuoteForm` |
| Soft CTAs | **Pass** — end-of-article + sidebar links to `/request-a-quote/` and `tel:` |
| Bottom band | **Pass** — shared `CtaBand` retained after related posts |
| Full forms remain | Service / contact / campaign / quote pages unchanged |
| Spot-check | Pickers article soft CTA navigates to `/request-a-quote/` |

## Remaining non-blocking polish notes

1. Archived Divi `html` / `plain_text` blobs in `src/data/content/*.json` still contain legacy WP paste instructions; they are not rendered by Astro page views  
2. Header/footer use current Full-Glow `/images/brand/logo.png` (WP `2026/11/Logo-Full-Glow-TransparentBackground`); early `logo-words.png` is archival only 

