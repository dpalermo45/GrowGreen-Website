# Google Business Profile reviews (website display)

**Scope:** Public website display of Google reviews only. Does **not** implement CRM review sync, review-request automation, replies, or customer matching.

**Status:** Implementation complete in this repo. Live connection is verified only after local OAuth + location confirmation.

---

## Confirmed Google Cloud setup (owner)

| Item | Value |
| --- | --- |
| Project | `ggwc-crm` (shared Cloud project; **separate** OAuth client from CRM) |
| OAuth client | Grow Green Website Reviews (Web application) |
| Scope | `https://www.googleapis.com/auth/business.manage` |
| Redirect URI | `http://localhost:4321/api/google-reviews/callback` (no trailing slash; Astro `trailingSlash: "ignore"` so this registered URI resolves) |
| APIs | Account Management, Business Information, My Business (`mybusiness.googleapis.com`) |

Do **not** reuse or edit the CRM OAuth client, CRM env, or CRM database.

---

## Environment (server-only)

Enter credentials in the website repo’s local **`.env`** (gitignored). Template placeholders live in **`.env.example`**.

| Variable | Purpose |
| --- | --- |
| `GOOGLE_REVIEWS_CLIENT_ID` | Website OAuth client ID |
| `GOOGLE_REVIEWS_CLIENT_SECRET` | Website OAuth client secret |
| `GOOGLE_REVIEWS_REDIRECT_URI` | Exact registered callback (`http://localhost:4321/...`) |
| `GOOGLE_REVIEWS_DATA_DIR` | Default `.data/google-reviews` (tokens + cache; gitignored) |
| `GOOGLE_REVIEWS_CACHE_TTL_SECONDS` | Soft refresh interval (default 6h) |
| `GOOGLE_REVIEWS_CACHE_MAX_AGE_SECONDS` | Absolute max retention ≤ 30 days |
| `GOOGLE_REVIEWS_DISPLAY_COUNT` | Max reviews shown in the UI sample |
| `GOOGLE_REVIEWS_SETUP_ENABLED` | Loopback setup allowed when not `false` |
| `GOOGLE_REVIEWS_SETUP_TOKEN` | Optional non-loopback setup gate |
| `GOOGLE_REVIEWS_CRON_SECRET` | Optional `POST /api/google-reviews/refresh/` auth |

Token files and review cache are **never** written under `public/` or committed to Git.

---

## Owner authorization (local)

1. Put client ID/secret in `.env`.
2. Keep `PUBLIC_SITE_URL=http://localhost:4321` for OAuth (do not switch to `127.0.0.1`).
3. Run `npm run dev` (port **4321**).
4. Open **http://localhost:4321/google-reviews/setup/**
5. Authorize → choose the correct Grow Green location → Confirm (nothing auto-selects the first row).
6. Homepage / lawn page load reviews from the temporary cache.

Setup routes return **404** off loopback unless `GOOGLE_REVIEWS_SETUP_TOKEN` matches.

OAuth uses authorization-code + PKCE + offline access + validated `state`. Only `business.manage` is requested; the app performs read-only account/location/review list calls.

---

## Retrieval

| Step | API |
| --- | --- |
| Accounts | My Business Account Management `accounts.list` |
| Locations | Business Information `accounts.locations.list` with required `readMask` |
| Reviews | `GET https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews` |

Pagination is followed. Display order is **`updateTime desc`**. The on-page sample shows only **5-star reviews that include a written comment** (star-only ratings are omitted). Google’s `averageRating` and `totalReviewCount` are still shown as returned from Google — never recalculated from the on-page sample. Profile link remains `https://share.google/kswC3aN1uIXDHrvAc`.

---

## Caching & automatic refresh (policy)

Per [Business Profile API policies — Content storage](https://developers.google.com/my-business/content/policies):

- Limited temporary storage only, **≤ 30 calendar days**, secure, not manipulated/aggregated for other products.
- Soft TTL (default 6 hours): `getDisplayReviews` / `GET /api/google-reviews/display/` refreshes when stale.
- Single-flight lock prevents concurrent refresh storms.
- Hard expiry deletes cache files; deleted/edited Google reviews disappear on refresh.
- Disconnect clears tokens, selection, and cache.

**Automatic updating in runtime:** visitor/SSR access to the display path triggers refresh when the soft TTL elapsed. For production warm-cache without relying on traffic spikes, schedule:

`POST /api/google-reviews/refresh/` with `Authorization: Bearer $GOOGLE_REVIEWS_CRON_SECRET`

more often than the soft TTL (e.g. every 3–6 hours). Persist `.data/google-reviews/` on the host volume across deploys.

API access alone does **not** prove every reuse is permitted; this site’s intended use is: owner-authorized listing, temporary performance cache, on-site attribution, link to Google, no rewriting/fabrication, no AggregateRating LocalBusiness markup for Google stars.

---

## Display component

`GoogleReviews.astro` — homepage + lawn fertilization page:

- Google average + total count when available
- Small recent sample of 5-star write-ups (author, stars, date, plain-text comment)
- Read more/less without changing wording
- Link to the public Google profile
- Fallback: clean Google link only (no invented ratings/testimonials)

---

## Production notes

- Set `GOOGLE_REVIEWS_SETUP_ENABLED=false`.
- Protect any remote setup with `GOOGLE_REVIEWS_SETUP_TOKEN` if needed.
- Configure cron secret + durable data directory.
- Do not add `LocalBusiness` `aggregateRating` / review JSON-LD for Google star rich results.
