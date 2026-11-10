# Proposed CRM repository documentation updates

**Status:** Proposal only. This website project does **not** modify the CRM repository or claim these were published.

## Suggested Academy / integration doc additions

1. **Website lead intake (public Astro site)**
   - Public browser → Astro `POST /api/leads/website/` (Node server adapter)
   - Website server → CRM `POST /integrations/api/v1/leads/` with Bearer token + `Idempotency-Key`
   - WordPress `/wp-json/ggwc/v1/website-lead` retired at website cutover — do not document WP as the live path after cutover

2. **Accepted CRM payload** (mirror Astro bridge + `integrations/views/api_v1.create_lead`):
   - Core: `first_name`, `last_name`, `email`, `phone`, `lead_source`, `notes`, `property.{address1,city,state,postal_code}`
   - Promotional SMS: `promotional_sms_opt_in`, `promotional_sms_disclosure` (must match CRM `PROMOTIONAL_SMS_DISCLOSURE` for consent to record; unchecked/false must remain false — never infer)
   - Attribution: `utm_*`, `fbclid`, `gclid`, `fbc`, `fbp`, `campaign_id`, `ad_id`, `browser_event_id` (aliases `event_id` / `eventID`), `event_source_url` (alias `page_url`)

3. **Acceptance response:** clients must require a non-null `customer.id` (HTTP 200/201 with null id is not success)

4. **SMS:** `sms_opt_in_status` in notes alone is **not** promotional consent. Astro sends first-class promotional fields. Service/estimate SMS disclosure is a different CRM string and must not be treated as promotional opt-in

5. **Automation:** lead create already feeds first-contact + office follow-up — websites must not duplicate welcome SMS/email/estimate SLA logic

6. **Careers:** employment applications are not customer leads and must not use the leads endpoint without a separate verified contract

7. **Attribution storage:** first-class UTM / click-ID / event URL fields on lead create; Astro no longer relies on stuffing those into `notes`

8. **Update `docs/website_lead_bridge.md` (CRM repo):** replace the WordPress → CRM diagram with:

```
Browser form (Facebook ad LP / homepage / quote forms)
  → POST https://growgreenweedcontrol.com/api/leads/website/
  → Astro Node endpoint (Authorization: Bearer from server env)
  → POST https://crm.growgreenweedcontrol.com/integrations/api/v1/leads/
```

   Keep the field map; note Astro owns mapping and secrets. Env vars live on the website host (`GGWC_CRM_BASE_URL`, `GGWC_CRM_API_KEY`, `GGWC_CRM_MODE`), not `wp-config.php`.

9. **Google reviews (website vs CRM):** Document that the public marketing site may use a **separate** Google Cloud OAuth client (`Grow Green Website Reviews`) in project `ggwc-crm` solely to display Business Profile reviews. CRM review sync, review-request automation, replies, and customer matching remain CRM/MCP concerns and must not share website token files or the website redirect URI (`http://localhost:4321/api/google-reviews/callback`).

10. **Meta Pixel PageView (website, 2026-11-10):** After the Astro site deploys with `PUBLIC_META_PIXEL_ID=1014961828315598`, update CRM-side docs when convenient (not done in the website PR):
    - `docs/specs/social-media/PHASE_6_CAPI.md` marketing-site Pixel audit: base PageView snippet is on the Astro `BaseLayout` (not WordPress/Divi); consent gate `__ggwcMarketingConsent === false`.
    - `docs/website_lead_bridge.md` / Events Manager checklist: browser PageView Pixel ID is `1014961828315598`; Lead still post-acceptance only; CAPI remains CRM-flagged/dry-run until a separate CRM change.
    - Admin Academy / MCP knowledge (`mcp-knowledge-stays-current` / Social Hub topics): note public-site PageView vs CRM CAPI lifecycle — do **not** claim CAPI is live from this website-only change.

11. **Meta Pixel Lead (website, quote acceptance):** When the Astro Lead browser event ships, CRM docs/Academy/MCP should note (proposal only — not applied here):
    - Browser `Lead` fires only after website `POST /api/leads/website/` confirms `ok` + `customer_id` (not careers, not mock, not thank-you revisits).
    - `eventID` equals CRM `browser_event_id` for CAPI dedupe; empty browser custom params (no PII in Pixel).
    - Website Pixel ID remains `1014961828315598`. Do not treat website Lead deploy as CAPI go-live.
