# CRM lead integration contract (website-owned)

This document separates **verified facts**, **implementation assumptions**, and **open gaps** for the Grow Green website → CRM lead bridge. It compares the legacy WordPress PHP proxy (`ggwc-crm-lead-proxy (2).php`) with the Astro endpoint at `POST /api/leads/website/`.

---

## Verified facts (from PHP proxy + this repo)

| Topic | Fact |
| --- | --- |
| Browser never holds CRM secrets | PHP used `GGWC_CRM_API_KEY` / `GGWC_CRM_BASE_URL` server constants; website uses env vars only. |
| Upstream path | `POST {CRM_BASE}/integrations/api/v1/leads/` |
| Auth | `Authorization: Bearer {API_KEY}` |
| Idempotency | `Idempotency-Key` request header (PHP: param or `uniqid`; website: client-provided UUID preferred) |
| Honeypot | Field `website` — if non-empty, return success-shaped response without calling CRM |
| Required fields | `name`, `email`, `phone`, `address`, `city`, `zip` (state defaults to `LA`) |
| Name split | First token → `first_name`; remainder → `last_name` |
| Phone | Digits-only before CRM |
| Payload shape | `first_name`, `last_name`, `email`, `phone`, `lead_source`, `notes`, `property.{address1,city,state,postal_code}` |
| Notes (PHP) | Fixed lines: “Website estimate request.”, optional Source/Page/Submitted, `SMS marketing opt-in: {Yes\|No}` |
| Acceptance (PHP) | HTTP status &lt; 400 **and** JSON `customer.id` present; response to browser `{ ok: true, customer_id }` with **201** |
| Careers | Must **not** use this lead intake. Live Divi posts to CRM public careers APIs; website proxies via `/api/careers/openings/` + `/api/careers/applications/` |

---

## Assumptions (website implementation)

| Topic | Assumption | Why |
| --- | --- | --- |
| Mock mode | `GGWC_CRM_MODE=mock` (default) accepts locally with a fake `customer_id` and never calls CRM | Safe local preview; missing live config must not fake success in `live` mode |
| Bare HTTP 200 | Empty/`{}` body or missing `customer.id` is **failure**, even if status is 200 | PHP already required `customer.id`; website strengthens “never celebrate bare 200” |
| Notes enrichment | Website appends UTM params, `promotion_code`, `services_interest`, and customer free-text into `notes` | Improves office context; CRM field set unchanged |
| SMS wording in notes | Clarifies self-reported form opt-in is **not** a CRM consent API field | Prevents false equivalence with true SMS consent systems |
| Lead source | Defaults to `Website`; Facebook November landings send exact Divi string `Facebook Ad - November 50% Off First Treatment (Up to $75)` | Preserves CRM reporting parity with live WP LP |
| Facebook LP form | `FacebookNovemberLanding` posts the same field set as Divi (UTM/fbclid, SMS status, honeypot, idempotency, promotion in notes) to `/api/leads/website/` | Replaces `/wp-json/ggwc/v1/website-lead` without browser CRM secrets |
| Meta Pixel Lead | Fires only after confirmed acceptance **and** `mocked !== true` | Prevents fake conversions in local/mock mode |
| Rate limiting | In-memory per-IP limits on website API | Not present in PHP proxy; defensive for public endpoint |
| Trailing slash | Prefer `/api/leads/website/`; Astro uses `trailingSlash: "ignore"` so Google’s registered `/api/google-reviews/callback` (no slash) also resolves | Legacy WP path was `/wp-json/ggwc/v1/website-lead` |
| Mapbox | Address suggest uses `PUBLIC_MAPBOX_TOKEN` in the browser; manual entry always allowed | UX only — not required for CRM |

---

## Gaps / needs verification

| Gap | Impact | Owner ask |
| --- | --- | --- |
| Full CRM OpenAPI / acceptance schema | Website parses `customer.id` like PHP; other success shapes unknown | Confirm documented response body for create-lead |
| Whether CRM returns 200 vs 201 on success | Website treats any &lt;400 with valid `customer.id` as success | Confirm status codes |
| True SMS/marketing opt-in API | Form checkbox only lands in notes | Confirm if CRM has a dedicated consent field/API |
| Careers live openings empty | CRM public openings currently returns `{ openings: [] }` | Confirm when positions are posted again |
| Idempotency semantics | Assumed CRM honors `Idempotency-Key` for retries | Confirm duplicate behavior |
| Promotion / offer codes | Sent in notes / `promotion_code` context only | Confirm if CRM has a first-class promo field |
| Analytics conversion | `ggwc_lead_accepted` fires only after confirmed acceptance | Wire GTM/Meta IDs later (hooks only now) |

---

## Endpoint map

| Client | Method | Path | Downstream |
| --- | --- | --- | --- |
| Quote forms | `POST` | `/api/leads/website/` | CRM leads API (or mock) |
| Careers openings | `GET` | `/api/careers/openings/` | CRM `GET /api/public/careers/openings/` (mock sample openings in `GGWC_CRM_MODE=mock`) |
| Careers applications | `POST` JSON (optional base64 résumé) | `/api/careers/applications/` | Website rebuilds multipart for CRM `POST /api/public/careers/applications/` — **not** CRM leads |
| Legacy careers JSON | `POST` | `/api/careers/` | **410** — use applications path |
| Legacy WP (retired) | `POST` | `/wp-json/ggwc/v1/website-lead` | Same CRM path via PHP |
| Google reviews display | `GET` | `/api/google-reviews/display/` | Cached Business Profile reviews (no secrets) |
| Google reviews OAuth start | `GET` | `/api/google-reviews/oauth/start/` | Loopback/setup-token only |
| Google reviews OAuth callback | `GET` | `/api/google-reviews/callback` | Registered redirect URI |
| Google reviews setup UI | `GET` | `/google-reviews/setup/` | Loopback/setup-token only |
| Google reviews refresh | `POST` | `/api/google-reviews/refresh/` | Loopback/setup-token or cron secret |

Website Google reviews are **display-only**. CRM MCP review sync / invitation workflows remain CRM-side and are not duplicated here.

---

## Env vars (website)

| Variable | Purpose |
| --- | --- |
| `GGWC_CRM_MODE` | `mock` \| `live` |
| `GGWC_CRM_BASE_URL` | CRM origin (no secrets in git) |
| `GGWC_CRM_API_KEY` | Bearer token |
| `GGWC_CRM_MOCK_SCENARIO` | Optional mock failure modes for tests |
| `PUBLIC_MAPBOX_TOKEN` | Browser address suggest |
| `PUBLIC_SITE_INDEXING` | `true` to allow robots/sitemap indexing |
| `PUBLIC_SITE_URL` | Canonical site origin |
| `GGWC_CAREERS_CRM_BASE_URL` | Optional override for public careers API origin |
| `GOOGLE_REVIEWS_CLIENT_ID` / `SECRET` | Website OAuth client (not CRM) |
| `GOOGLE_REVIEWS_REDIRECT_URI` | Exact Google Console callback |
| `GOOGLE_REVIEWS_DATA_DIR` | Token + temporary cache directory (gitignored) |
| `GOOGLE_REVIEWS_SETUP_*` / `CRON_SECRET` | Setup gate + scheduled refresh |

---

## Non-goals

- Do not duplicate CRM welcome texts, estimate workflows, or office SLA automation on the website.
- Do not rebuild the customer portal or payment processor inside this repo.
- Do not invent CRM fields that the PHP proxy never sent.
