# Google Analytics 4 (website page views)

Browser Google tag (gtag.js) for the Grow Green marketing site. Page views only — no form field or PII payloads. Meta Pixel Lead / CRM CAPI remain separate.

## Behavior

| Concern | Behavior |
| --- | --- |
| Install location | Shared `src/layouts/BaseLayout.astro` `<head>` (all public pages) |
| Measurement ID | From `PUBLIC_GA_MEASUREMENT_ID` (production value: `G-8PF7LD6SRT`) |
| Local / preview | Leave `PUBLIC_GA_MEASUREMENT_ID` empty → no gtag.js load, no page_view |
| Init | Once per browsing context (`window.__ggwcGa4Initialized`); `send_page_view: false` |
| page_view | Once per distinct `pathname + search`; also listens for `astro:page-load` if client navigation is used |
| Payload | `page_path`, `page_title`, `page_location` only — never names, email, phone, address, or form contents |
| Consent | Honors `window.__ggwcMarketingConsent === false` (explicit deny). Unset consent allows tracking |
| Coexistence | Meta Pixel / `ggwcTrack` / `dataLayer` unchanged; do not also paste a second GTM/gtag with the same ID |
| Failure isolation | GA4 failures never block lead submit or success UI |

## Required production env (Render)

```bash
PUBLIC_GA_MEASUREMENT_ID=G-8PF7LD6SRT
```

Must be present **at build time** (Astro bakes `PUBLIC_*` into HTML). Rebuild after setting or changing the ID.

Do **not** set this in local `.env` unless you intentionally want GA4 traffic from localhost.

## Verify after deploy

1. Production HTML `<head>` includes the gtag bootstrap and Measurement ID `G-8PF7LD6SRT`.
2. GA4 Realtime (or DebugView) shows page_view on a production page load.
3. Soft refresh / same-URL `astro:page-load` does not double-count.
4. Local/preview with empty env: no `googletagmanager.com/gtag/js` request.
5. Consent deny (`__ggwcMarketingConsent = false`): no page_view; forms still work.

## Non-goals

- Do not send quote form fields or customer PII to GA4.
- Do not replace Meta Pixel Lead with a GA4 conversion in this change.
- Do not enable CRM CAPI from this website repo.
