# Meta Pixel (website PageView + Lead)

Browser Meta Pixel for the Grow Green marketing site. CRM Conversions API / Subscribe / Purchase remain **out of scope** here.

## Behavior

| Concern | Behavior |
| --- | --- |
| Install location | Shared `src/layouts/BaseLayout.astro` (all public pages) |
| Pixel ID | From `PUBLIC_META_PIXEL_ID` (production value: `1014961828315598`) |
| Local / preview | Leave `PUBLIC_META_PIXEL_ID` empty → no `fbq` script, no noscript pixel |
| Init | Once per browsing context (`window.__ggwcMetaPixelInitialized`) |
| PageView | Once per distinct `pathname + search`; also listens for `astro:page-load` if client navigation is added later |
| Lead | `window.ggwcTrackMetaLead` after confirmed `POST /api/leads/website/` acceptance only |
| Lead `eventID` | Same value as CRM `browser_event_id` / form idempotency key; retries reuse it |
| Lead params | Empty object `{}` — no names, email, phone, or form contents |
| Consent | Honors `window.__ggwcMarketingConsent === false` (explicit deny). Unset consent allows tracking |
| Duplicate IDs | Do not also paste a Divi/GTM Pixel with a different or same ID |
| Failure isolation | Pixel/consent failures never block lead submit or success UI |

## Lead acceptance (required)

Browser Lead fires only when **all** are true:

1. HTTP response is OK
2. JSON `ok === true`
3. `customer_id` is non-null / non-empty
4. Not honeypot soft-success (`ignored !== true`)
5. Not mock CRM (`mocked !== true`)
6. Pixel available (`fbq`) and marketing consent not denied
7. This `browser_event_id` has not already fired Lead (memory + `sessionStorage`)

Bare HTTP 2xx without a confirmed `customer_id` is **not** a lead.

## Forms covered

| Form | Component | Notes |
| --- | --- | --- |
| Homepage / service / campaign embed | `QuoteForm.astro` | Shared helper after acceptance |
| Request a quote | `RequestQuotePage.astro` | Shared helper after acceptance |
| Facebook November LP | `FacebookNovemberLanding.astro` | Consolidated onto shared helper (no raw `fbq('Lead')`) |

**Not** Lead events: careers applications, button clicks, form views, validation failures, rejected/failed requests, or revisits of retired `/thank-you/` URLs (those redirect home; confirmation is inline on the form page).

## Required production env (Render)

```bash
PUBLIC_META_PIXEL_ID=1014961828315598
```

Already required for PageView. Lead uses the same Pixel; no extra website env vars.

Do **not** set this in local `.env` unless you intentionally want Pixel traffic from localhost.

## Verify after deploy (not claimed until done)

1. Submit a live quote (office-aware): Events Manager shows one `Lead` with `eventID` matching CRM `browser_event_id`.
2. Retry / double-click / refresh after inline success: no second Lead for the same id.
3. Mock/local: no Lead (Pixel off or `mocked: true`).
4. Consent deny (`__ggwcMarketingConsent = false`): submit still succeeds; no Lead.

## Non-goals (follow-up elsewhere)

- Do not enable CRM `META_CAPI_*` / flip `GGWC_SOCIAL_CAPI_DRY_RUN` from this website change.
- CRM already documents `browser_event_id` dedupe + server CAPI queue — preserve that contract; do not change CRM code here.
- CRM Academy / MCP knowledge updates are proposed in `docs/crm-doc-proposals.md` only — not applied here.
