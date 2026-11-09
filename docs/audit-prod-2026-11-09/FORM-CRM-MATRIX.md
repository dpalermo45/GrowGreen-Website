# Form / CRM test matrix — 2026-11-09

## Forms inventory (from `src/data/forms-inventory.ts` + production crawl)

| Form | Placements | Handler | Prod non-mutating checks | Live mutating | Notes |
| --- | --- | --- | --- | --- | --- |
| Quote (multi-step) | `/request-a-quote/`, homepage embed | `POST /api/leads/website/` → CRM leads | Endpoint **400** on empty JSON with validation message | **BLOCKED** (no auth) | SMS checkbox unchecked by default; disclosure present |
| Campaign $25 / FB | `/post-card-estimate-request/`, `/nextdoor-estimate-request/`, `/trucklead/`, Facebook LPs | Same lead API + campaign `lead_source` | Pages **200**, offer copy matches config | **BLOCKED** | Offer amounts are display/notes — not client-trusted credits |
| Contact | `/contact-us/` | Lead/contact path per implementation | Page **200** | **BLOCKED** | |
| Careers | `/careers/` | `/api/careers/applications/` (not leads) | Openings `[]`; form **disabled** | N/A (no openings) | Correctly separated from lead intake |

## Contract checks (code + docs — not live CRM write)

| Check | Result |
| --- | --- |
| Browser never holds CRM API key | **PASS** (server env only) |
| Upstream path `/integrations/api/v1/leads/` | Documented + unit-tested mapping |
| Idempotency-Key | Unit-tested |
| Honeypot soft-success | Unit-tested |
| `promotional_sms_opt_in` false when unchecked | Unit-tested |
| Disclosure exact match required for opt-in | Unit-tested |
| UTM / gclid / fbclid / event_source_url mapped | Unit-tested |
| Bare HTTP 200 without `customer.id` = failure | Unit-tested |
| Rate limit | In-memory per IP (observed **429** under local hammering) |
| Mock vs live | Local `.env` currently **live** → `launch:verify` mock-lead fails with CRM “Blocked email domain” unless `GGWC_CRM_MODE=mock` |

## Authorized live test payload (do not run without office approval)

```json
{
  "name": "Office Audit Test",
  "email": "<office-approved-test-inbox>",
  "phone": "<office-approved-test-phone>",
  "address": "14464 L Keller Rd",
  "city": "St. Amant",
  "state": "LA",
  "zip": "70774",
  "source": "Website",
  "page_url": "https://growgreenweedcontrol.com/request-a-quote/",
  "promotional_sms_opt_in": false,
  "notes": "AUTHORIZED production audit lead — discard after CRM field check",
  "utm_source": "audit",
  "utm_medium": "qa",
  "utm_campaign": "prod-readiness-2026-11-09",
  "idempotency_key": "ggwc-audit-2026-11-09-001"
}
```

**Expected CRM effects:** one customer/lead; SMS consent **not** recorded; UTMs stored; office follow-up may fire — warn staff before submit.

**Verify via:** permitted CRM lead/customer view (not website 200 alone).

## Remaining live blockers

1. Explicit authorization for one production test lead.
2. Confirm `GGWC_CRM_MODE=live` + valid API key on Render (non-mutating validation already proves endpoint reaches CRM rejection path).
3. Confirm idempotent retry does not duplicate after acceptance.
4. Careers live application when an opening is posted.
