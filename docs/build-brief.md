# Durable Build Brief — Grow Green Weed Control Website

## Goal

Replace WordPress with a custom, crawlable website that preserves URLs, brand, service coverage, and CRM lead intake — without touching live DNS/CRM/portal.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Site | Astro (hybrid) | Static HTML for SEO/content; islands for forms |
| Runtime | Node adapter | Server endpoint for CRM bridge |
| Styles | Scoped CSS + CSS variables | Match greens/cream/gold without heavy UI kits |
| Tests | Vitest + Node test helpers | Lead mapping, validation, idempotency |
| Media | Curated `public/images` | Not full `website-media` tree |

## Information architecture

1. **Core:** Home, About, Services hub, Contact, Request a Quote, Careers, Privacy, Terms, Blog index  
2. **Service detail:** All 9 service categories (+ existing WP distinctions such as lawn fungus, lawn insects, plant disease/pest, tree & shrub)  
3. **Local/geo:** Preserve existing city/parish URLs; add lightweight area pages for remaining of 40 locations that lack dedicated URLs (hub + individual coverage pages with distinct, non-thin copy)  
4. **Blog:** All 8 posts at original slugs  
5. **Campaigns:** Configurable offer pages (`request-an-estimate-facebook-50`, gym, nextdoor, postcard, trucklead, facebook-estimate-request) — separate from global CTAs  
6. **Utility:** Thank-you variants, customer portal link page, 404  

## Design direction

- Grow Green forest greens, cream/white surfaces, gold/yellow CTAs  
- Brand-first hero (logo + company identity visible without nav)  
- Full-bleed authentic lawn/truck/people photography  
- Original logos + mascot (no redraw)  
- Mobile-first forms; sticky phone + quote CTAs  
- Omit unverified social-proof numbers until confirmed (see open questions)

## CRM bridge (website-owned)

- `POST /api/leads/website` (public path; also accept legacy alias redirect docs)  
- Env: `GGWC_CRM_BASE_URL`, `GGWC_CRM_API_KEY`, `GGWC_CRM_MODE=mock|live`, map token separate  
- Payload mapping mirrors PHP proxy; improvements documented in integration notes  
- Success only when acceptance criteria met (not bare 200)  
- Careers form = separate handler (email/store) — not lead intake  

## SEO

- Rendered HTML, titles/descriptions, canonicals, sitemap, robots  
- Preview/staging: `noindex,nofollow` via `PUBLIC_SITE_INDEXING=false`  
- Structured data: LocalBusiness / Service / Article where accurate  
- Priority care: `/`, pickers article, fertilizing guide, `/contact-us/`  

## Out of scope this build

- Live deploy, DNS, SSL cutover  
- GTM/GA4 IDs; Meta Pixel PageView is wired via `PUBLIC_META_PIXEL_ID` (see `docs/meta-pixel.md`)  
- Service-area interactive map (optional later; no multi-office markers)  
- CRM welcome automation duplication  
- Rebuilding portal/payments  

## Delivery checkpoints

1. Inventories + manifests  
2. Scaffold + design system  
3. All retained URLs rendering  
4. Lead API + form UX + tests (mocked)  
5. Image catalog + curated assets  
6. Local preview + handoff docs + blockers  
