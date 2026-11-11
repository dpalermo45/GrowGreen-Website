# CRM lead integration contract (website-owned)

This document separates **verified facts**, **implementation assumptions**, and **open gaps** for the Grow Green website → CRM lead bridge. It compares the legacy WordPress PHP proxy (`ggwc-crm-lead-proxy (2).php`) with the Astro endpoint at `POST /api/leads/website/`.

CRM request fields below were verified from the local CRM repo (`integrations/views/api_v1.py` → `api_create_lead`, plus `customers/services/promotional_sms_consent.py`).

---

## Verified facts (from PHP proxy + CRM repo + this site)

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
| Core payload | `first_name`, `last_name`, `email`, `phone`, `lead_source`, `notes`, `property.{address1,city,state,postal_code}` |
| Promotional SMS (CRM) | First-class `promotional_sms_opt_in` + `promotional_sms_disclosure`. CRM records consent only when opt-in is affirmative **and** disclosure matches CRM `PROMOTIONAL_SMS_DISCLOSURE` exactly (whitespace-normalized). Missing/false → no consent. |
| Attribution (CRM) | First-class `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`, `gclid`, `fbc`, `fbp`, `campaign_id`, `ad_id`, `browser_event_id` (aliases `event_id` / `eventID`), `event_source_url` (alias `page_url`) |
| Notes (legacy PHP) | Fixed lines: “Website estimate request.”, optional Source/Page/Submitted, `SMS marketing opt-in: {Yes\|No}` — Astro no longer puts SMS/UTM into notes |
| Acceptance | HTTP status &lt; 400 **and** JSON `customer.id` present; response to browser `{ ok: true, customer_id }` with **201** |
| Careers | Must **not** use this lead intake. Live Divi posts to CRM public careers APIs; website proxies via `/api/careers/openings/` + `/api/careers/applications/` |
| Welcome / follow-up | Owned by CRM after accepted lead create — website must not send welcome SMS/email or office SLA texts |

---

## Assumptions (website implementation)

| Topic | Assumption | Why |
| --- | --- | --- |
| Mock mode | `GGWC_CRM_MODE=mock` (default) accepts locally with a fake `customer_id` and never calls CRM | Safe local preview; missing live config must not fake success in `live` mode |
| Bare HTTP 200 | Empty/`{}` body or missing `customer.id` is **failure**, even if status is 200 | PHP already required `customer.id`; website strengthens “never celebrate bare 200” |
| Consent never inferred | Unchecked / missing → `promotional_sms_opt_in: false`. Disclosure is whatever the form presented (sent verbatim); website forms use CRM’s canonical promotional disclosure text | Matches CRM `opted_in_value` / disclosure match rules |
| Attribution mapping | Supported UTM / click-ID / `event_source_url` sent as CRM fields; `lead_source` unchanged (`Website` default; Facebook LP keeps Divi string) | Parity with CRM `create_lead` view |
| Notes enrichment | Source / Page / Submitted / promotion / services / customer free-text only | Office context without duplicating consent or attribution |
| Facebook LP form | `FacebookNovemberLanding` posts the same consent + attribution contract to `/api/leads/website/` | Replaces `/wp-json/ggwc/v1/website-lead` without browser CRM secrets |
| GA4 page_view | Google tag in `BaseLayout` `<head>` when `PUBLIC_GA_MEASUREMENT_ID` is set; disabled when unset (local/preview); no PII/form payloads | See `docs/ga4.md` |
| Meta Pixel PageView | Base snippet in `BaseLayout` when `PUBLIC_META_PIXEL_ID` is set; disabled when unset (local/preview) | See `docs/meta-pixel.md` |
| Meta Pixel Lead | `ggwcTrackMetaLead` after confirmed acceptance (`ok` + `customer_id`, not `ignored`/`mocked`); `eventID` = `browser_event_id`; empty custom params; memory + sessionStorage dedupe | QuoteForm, RequestQuotePage, FacebookNovemberLanding; Pixel never blocks submit |
| Quote success UX | Inline “Thank you!” confirmation on the form page (no `/thank-you/` navigation); promo landings keep offer confirmation | Failed submits keep the form + error/retry |
| Rate limiting | In-memory per-IP limits on website API | Not present in PHP proxy; defensive for public endpoint |
| Trailing slash | Prefer `/api/leads/website/`; Astro uses `trailingSlash: "ignore"` so Google’s registered `/api/google-reviews/callback` (no slash) also resolves | Legacy WP path was `/wp-json/ggwc/v1/website-lead` |
| Mapbox | Address suggest uses `PUBLIC_MAPBOX_TOKEN` in the browser; manual entry always allowed | UX only — not required for CRM |

---

## Gaps / needs verification

| Gap | Impact | Owner ask |
| --- | --- | --- |
| Whether CRM returns 200 vs 201 on success | Website treats any &lt;400 with valid `customer.id` as success | Confirm status codes in production |
| Idempotency semantics | Assumed CRM honors `Idempotency-Key` for retries | Confirm duplicate behavior |
| Promotion / offer codes | Still notes / `promotion_code` context only | Confirm if CRM adds a first-class promo field later |
| Careers live openings empty | CRM public openings currently returns `{ openings: [] }` | Confirm when positions are posted again |
| Analytics conversion | `ggwc_lead_accepted` + Meta `Lead` only after confirmed acceptance; Meta uses `PUBLIC_META_PIXEL_ID`; GA4 is page_view only | CAPI is CRM-side |
| Controlled live CRM smoke | Local stays `GGWC_CRM_MODE=mock` | One office-aware live test on staging/host before cutover |

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
| `PUBLIC_META_PIXEL_ID` | Meta Pixel ID for PageView (`1014961828315598` in production; empty disables) |
| `PUBLIC_GA_MEASUREMENT_ID` | GA4 Measurement ID for page views (`G-8PF7LD6SRT` in production; empty disables) |
| `GGWC_CAREERS_CRM_BASE_URL` | Optional override for public careers API origin |
| `GOOGLE_REVIEWS_CLIENT_ID` / `SECRET` | Website OAuth client (not CRM) |
| `GOOGLE_REVIEWS_REDIRECT_URI` | Exact Google Console callback |
| `GOOGLE_REVIEWS_DATA_DIR` | Token + temporary cache directory (gitignored) |
| `GOOGLE_REVIEWS_SETUP_*` / `CRON_SECRET` | Setup gate + scheduled refresh |

---

## Non-goals

- Do not duplicate CRM welcome texts, estimate workflows, or office SLA automation on the website.
- Do not rebuild the customer portal or payment processor inside this repo.
- Do not invent CRM fields beyond the verified `create_lead` request surface.
