# Pre-launch security scan

**Date:** 2026-11-07  
**Scope:** `npm run build` artifacts (`dist/`) and `src/` source (code fixes only; no deploy).

## Build

- **Attempted:** `npm run build` from the project root.
- **Result:** Build did not complete in this environment (`node` not on PATH for the agent shell). Scan used the existing `dist/` tree on disk (may predate latest source edits).

## Pattern scan (`dist/`)

Searched for: `GGWC_CRM_API_KEY`, `client_secret`, `Bearer ey`, `sk_live`, `GOOGLE_REVIEWS_CLIENT_SECRET`, `private_key`, `-----BEGIN`, and long `eyJ` / `sk_` / `AIza` tokens.

| Location | Finding |
|----------|---------|
| `dist/client/**` | **No matches** — no secret env names or token-shaped values in client bundles. |
| `dist/server/**` | **Env wiring only** — server chunks reference `GGWC_CRM_API_KEY`, `GOOGLE_REVIEWS_CLIENT_SECRET`, and OAuth `client_secret` *field names* via `process.env` / config readers. No literal API keys, Bearer tokens, or `private_key` PEM bodies found. |

## Pattern scan (`src/`)

| Finding | Risk | Action |
|---------|------|--------|
| `src/lib/leads/submit.ts`, `src/lib/google-reviews/config.ts`, `src/lib/google-reviews/oauth.ts` | Reads secrets from environment (`GGWC_CRM_API_KEY`, `GOOGLE_REVIEWS_CLIENT_SECRET`); OAuth uses `client_secret` as a request field name | **Expected** — server-only; not hardcoded values |
| No `Bearer ey`, `sk_live`, PEM blocks, or literal keys in `src/` | — | **Pass** |

## Fixes applied

None required for client bundle leakage (client artifacts clean on last `dist/`).

## Remaining blockers / follow-up

1. **Re-run `npm run build` locally** after these changes and re-scan `dist/client` before production cutover (agent could not refresh `dist/` here).
2. Confirm production host injects CRM and Google Reviews secrets only via server env — never `PUBLIC_*` Astro vars.
