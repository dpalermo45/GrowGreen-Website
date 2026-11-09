# Pre-launch business claims scan

**Date:** 2026-11-07  
**Scope:** Live Astro pages and components under `src/components/` and `src/pages/` (excludes WP JSON dumps under `src/data/content/`).

## Phone & email

| Rule | Result |
|------|--------|
| Phone `(225) 461-3199` / `tel:+12254613199` | **Pass** — `site.ts` is canonical; Header, Footer, forms, and portal page use `site.phone` / `site.phoneTel`. Placeholder `(225) 555-*` only on form inputs. |
| Email `office@growgreenweedcontrol.com` | **Pass** — canonical in `site.email`; contact and portal pages reference `site`. |

## Starting price ($39/month)

| Area | Result |
|------|--------|
| Most service, quote, parish/city, and service-area pages | **Pass** — include “starts at” plus lawn-size / service dependency language |
| Homepage hero | **Fixed** — now uses `site.startingPrice.short` |
| Services hub signature card bullet | **Fixed** — dependency phrase added |
| Lawn fertilization hero lead + bullet | **Fixed** — dependency language in lead; bullet notes sizing |

Proof bars that pair “From/Starts at $39/month” with “Final price by lawn size” were already compliant.

## Mowing

| Result |
|--------|
| **Pass** — No mowing services advertised. Copy consistently states treatment-focused work and “not mowing” where relevant (FAQ, proof bars, service area pages). Educational mentions of mowing height/injury only. |

## Unverified social proof (600+ / 4.9★)

| Area | Result |
|------|--------|
| `src/components`, `src/pages` (`*.astro`) | **Pass** — no live `600+` or `4.9-star` customer-count/rating claims |
| `src/data/services.ts` | Claims listed under `scrubbedClaims` only (not rendered) |
| `GoogleReviews.astro` | Uses Google-supplied API/cache data when available; fallback is profile link only |
| `src/data/content/*.json` | Legacy WP text may still contain old claims — not served as live Astro body without scrubbing |

## Customer portal

| Check | Result |
|-------|--------|
| `customer-login-pay-bill.astro` | **Pass** — primary CTA `href={site.portalUrl}` → `https://portal.growgreenweedcontrol.com/portal/` (`noopener`, `target="_blank"`) |

## Mascot (lush-lawn / black bar)

| Area | Result |
|------|--------|
| Photo heroes (service pages) | **Pass** — backpack-sprayer or service-specific mascots; no `lush-lawn` on photo heroes |
| Service area city callout | **Fixed** — `lush-lawn-240.webp` replaced with `firefighter-240.webp` in `service-areas/[slug].astro` |

## Remaining blockers

1. **Exact visit count / contract terms** — live marketing softened to seasonal-visit and “billing options / terms in estimate” language (2026-11-08). Restore harder “8 visits” / “no long-term contract” claims only after owner confirmation (`site.claimsNeedingVerification`).
2. **Regenerate `dist/`** after copy/image changes before production deploy (`npm run build`).
