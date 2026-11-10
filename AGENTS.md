# Grow Green Weed Control — Website Project Instructions

This repository is the **custom Grow Green Weed Control public website**, replacing WordPress. It is **isolated from the CRM repository**.

## Isolation (non-negotiable)

- Work **only** inside this website workspace.
- Do **not** modify, copy, or deploy from the CRM repo, credentials, deployment settings, or database.
- Do **not** deploy or change the live website, DNS, CRM, or customer portal from this project unless the owner explicitly requests it later.
- Link to the existing customer portal; do **not** rebuild payments or accounts.

## Source materials (preserve originals)

Located at the workspace root (gitignored where appropriate):

- WordPress XML export
- Search Console Performance + Coverage / Coverage-Drilldown Excel workbooks
- `website-media.zip` and extracted `website-media/`
- `form page code.txt` (empty as of inventory — reconstruct from proxy + WP content)
- `ggwc-crm-lead-proxy*.php`
- `Design-References/` screenshots (inspiration only; do not copy competitor content)

Verified WordPress counts: **56 published pages**, **8 published posts**, **303 attachment records** (status `inherit`). All 303 attachment files were found under `website-media/uploads`.

Identify Search Console indexing categories from each workbook’s **Metadata** sheet (`Issue` property), not from filename suffixes.

## Architecture choice

**Astro (hybrid) + Node server adapter** for mostly static, crawlable HTML plus a small server endpoint for CRM lead intake. Rationale: content-heavy marketing site benefits from static HTML/SEO defaults; the lead bridge needs a server-side secret store and outbound HTTP that must never ship to the browser.

## Business facts (confirmed for this build)

- Grow Green Weed Control
- Phone: `(225) 461-3199`
- Email: `office@growgreenweedcontrol.com`
- Hours: Monday–Friday, 8 AM–4 PM America/Chicago
- Public address: `14464 L Keller Rd, St. Amant, LA 70774`
- Starting price: lawn fertilization and weed control **starts at $39/month** — starting pricing, not an instant property quote; final pricing depends on lawn size and selected services
- Identity: local, family-owned, firefighter-owned
- Do **not** advertise mowing

## Claims & promotions

- Do **not** invent employees, testimonials, customer locations, or before/after results.
- Do **not** turn screenshot claims (review ratings, customer counts, guarantees, contract terms) into confirmed facts — flag for verification or omit.
- Campaign offers stay separate, configurable, and reviewable for expiration (e.g. November Facebook: 50% off first lawn treatment, max $75 discount).

## Services (retain all)

1. Lawn fertilization and weed control  
2. Flower bed weed control and fertilization  
3. Fire ant treatments  
4. Mosquito, flea, and tick treatments  
5. Tree and shrub care  
6. Lawn fungus and insect treatments  
7. Soil sampling  
8. Liquid aeration  
9. Core aeration  

## Service areas

Accept customers in all **40** locations listed in `src/data/service-areas.ts`. Provide useful coverage without automatically creating every service × city combination. No multi-office map markers.

## URLs & search

- Preserve published page/post URLs wherever practical.
- Record each URL outcome in `docs/url-migration-manifest.md`: retained | redirected | intentionally excluded | retired.
- Do not redirect unrelated missing URLs to the homepage.
- Do not recreate WP admin, feeds, or obsolete archives solely to clear GSC exclusions.
- Private previews: `noindex` until production launch checklist enables indexing.

Priority migration care (verified from Performance workbook): homepage (583 clicks), pickers/stickers/burweed article (408), South Louisiana fertilizing guide (117), contact (59).

## CRM lead integration

- Browser posts to a **website-owned** server endpoint (replacement for `/wp-json/ggwc/v1/website-lead`).
- Server posts to `{CRM_BASE}/integrations/api/v1/leads/` with Bearer auth and `Idempotency-Key`.
- Auth stays in env vars only — never in browser, build output, logs, or Git.
- Preserve field transforms, property structure, lead source, idempotency, and honeypot behavior from the PHP bridge.
- Never show success on bare HTTP 200; validate documented acceptance response.
- Mock CRM in development; missing config = clear failure, never fake success.
- Website must **not** duplicate CRM welcome texts/emails, estimate workflows, or office SLA logic.
- Consent text in notes is **not** proof of CRM SMS opt-in.
- Careers / job applications must **not** route into customer lead intake without a verified contract.

## Tracking

- **Meta Pixel PageView:** install in `BaseLayout` when `PUBLIC_META_PIXEL_ID` is set (production: `1014961828315598`). Leave empty for local/preview. See `docs/meta-pixel.md`.
- Init once; one PageView per real navigation (`astro:page-load` safe). Honor `window.__ggwcMarketingConsent === false`.
- GTM/GA4 IDs remain deferred. Fire browser Lead conversion events only after confirmed CRM acceptance; prevent duplicates. Do not enable CRM CAPI from this repo.

## Google reviews (website display only)

- Use the **website** OAuth client (`Grow Green Website Reviews`) and tokens under gitignored `.data/google-reviews/`. Never reuse or modify the CRM Google OAuth client, CRM env, or CRM database.
- Scope: `business.manage` with read-only account / location / review list calls. Setup routes are loopback-gated (or setup-token gated); registered callback: `http://localhost:4321/api/google-reviews/callback`.
- Temporary review cache ≤ 30 days per Google Business Profile API content-storage policy; soft TTL refresh via display API / scheduled `POST /api/google-reviews/refresh/`. Do not commit review content or tokens.
- Display via `GoogleReviews.astro` with Google-supplied `averageRating` / `totalReviewCount`, recent sample (`updateTime desc`), attribution, and profile link. Unavailable → Google link only; never invent ratings or add AggregateRating LocalBusiness markup for star rich results.
- See `docs/google-reviews.md`.

## Media

- Use original logos and mascot without redrawing/distorting.
- Ship curated responsive derivatives under `public/` — not the entire raw uploads tree.
- Maintain `docs/image-catalog.md` and photo replacement instructions.

## Documentation required

- README (local setup + preview)
- This file (`AGENTS.md`)
- URL migration manifest
- Image catalog + photo replacement instructions
- Integration contract notes (verified / assumptions / gaps)
- Test results + launch blockers
- Launch/rollback checklist
- Proposed CRM-repo doc updates (proposal only — do not edit CRM repo)

## Non-blocking questions

Record in `docs/open-questions.md`. Do not block core site progress on them.
