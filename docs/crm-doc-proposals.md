# Proposed CRM repository documentation updates

**Status:** Proposal only. This website project does **not** modify the CRM repository or claim these were published.

## Suggested Academy / integration doc additions

1. **Website lead intake (public site)**
   - Public browser → website `POST /api/leads/website/`
   - Website server → CRM `POST /integrations/api/v1/leads/` with Bearer token + `Idempotency-Key`
   - WordPress `/wp-json/ggwc/v1/website-lead` retired at website cutover

2. **Accepted payload** (mirror current bridge): `first_name`, `last_name`, `email`, `phone`, `lead_source`, `notes`, `property.{address1,city,state,postal_code}`

3. **Acceptance response:** document that clients must require a non-null `customer.id` (HTTP 200/201 with null id is not success)

4. **SMS:** language in `notes` is informational unless/until a dedicated consent field is supported and documented

5. **Automation:** lead create already feeds first-contact + office follow-up — websites must not duplicate welcome SMS/email/estimate SLA logic

6. **Careers:** employment applications are not customer leads and must not use the leads endpoint without a separate verified contract

7. **Tracking fields:** UTM/fbclid/promotion context may arrive inside `notes` until first-class fields exist

8. **Google reviews (website vs CRM):** Document that the public marketing site may use a **separate** Google Cloud OAuth client (`Grow Green Website Reviews`) in project `ggwc-crm` solely to display Business Profile reviews. CRM review sync, review-request automation, replies, and customer matching remain CRM/MCP concerns and must not share website token files or the website redirect URI (`http://localhost:4321/api/google-reviews/callback`).
