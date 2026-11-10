# Meta Pixel (website PageView)

PageView-only browser Pixel for the Grow Green marketing site. Lead / Subscribe / Purchase browser events and CRM Conversions API are **out of scope** for this install.

## Behavior

| Concern | Behavior |
| --- | --- |
| Install location | Shared `src/layouts/BaseLayout.astro` (all public pages) |
| Pixel ID | From `PUBLIC_META_PIXEL_ID` (production value: `1014961828315598`) |
| Local / preview | Leave `PUBLIC_META_PIXEL_ID` empty → no `fbq` script, no noscript pixel |
| Init | Once per browsing context (`window.__ggwcMetaPixelInitialized`) |
| PageView | Once per distinct `pathname + search`; also listens for `astro:page-load` if client navigation is added later |
| Consent | Honors `window.__ggwcMarketingConsent === false` (explicit deny). Unset consent allows tracking (no CMP banner yet) |
| Lead forms | Unchanged — existing post-acceptance `fbq('track','Lead')` / `ggwcTrack` / `browser_event_id` paths preserved |
| Duplicate IDs | Do not also paste a Divi/GTM Pixel with a different or same ID |

## Required production env (Render)

Set on the **GrowGreen-Website** service (build + runtime), then **redeploy/rebuild**:

```bash
PUBLIC_META_PIXEL_ID=1014961828315598
```

`PUBLIC_*` values are baked into the Astro SSR build. Changing the ID without a rebuild will not update HTML.

Do **not** set this in local `.env` unless you intentionally want Pixel traffic from localhost.

## Verify after deploy (not claimed until done)

1. View source / Network: `fbevents.js` loads once; `PageView` once per navigation.
2. Meta Events Manager → Test Events (or Diagnostics) for Pixel `1014961828315598`.
3. Confirm no second Pixel ID is still installed via GTM or leftover WordPress snippets.

Tracking is **not live** until that deploy + browser evidence exist.

## Non-goals (follow-up elsewhere)

- Do not enable CRM `META_CAPI_*` / flip `GGWC_SOCIAL_CAPI_DRY_RUN` from this website change.
- Do not add browser Lead / Subscribe / Purchase in this step (Lead already gated in Facebook LP JS after CRM acceptance).
- CRM Academy / MCP knowledge updates are proposed in `docs/crm-doc-proposals.md` only — not applied here.
