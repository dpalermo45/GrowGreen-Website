# Grow Green Weed Control — Website

Custom replacement for the WordPress marketing site. **Isolated from the CRM repository.** Does not deploy or change live DNS/CRM/portal by default.

## Architecture

**Astro (hybrid) + Node adapter**: mostly crawlable HTML pages with a small server endpoint for CRM lead intake (`POST /api/leads/website/`). Secrets stay in environment variables.

## Prerequisites

- Node.js 20+
- npm 10+

## Local setup

```bash
cp .env.example .env
npm install
npm run media:curate   # optional refresh of curated images from website-media/
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

### Environment

See `.env.example`. Important:

| Variable | Purpose |
| --- | --- |
| `PUBLIC_SITE_INDEXING` | `false` keeps `noindex` for previews |
| `GGWC_CRM_MODE` | `mock` (default) or `live` |
| `GGWC_CRM_BASE_URL` / `GGWC_CRM_API_KEY` | Required only for `live` |
| `PUBLIC_MAPBOX_TOKEN` | Optional address autocomplete |
| `PUBLIC_META_PIXEL_ID` | Meta Pixel ID for PageView + post-acceptance Lead (empty locally; production `1014961828315598` — see `docs/meta-pixel.md`) |
| `GOOGLE_REVIEWS_*` | Website-only Google Business Profile OAuth + review cache (see `.env.example` and `docs/google-reviews.md`) |

**Never commit `.env`.** Missing live CRM config fails closed — it never fakes success.

### Google reviews (local authorization)

1. Create/copy `.env` and set **`GOOGLE_REVIEWS_CLIENT_ID`** + **`GOOGLE_REVIEWS_CLIENT_SECRET`** from the **Grow Green Website Reviews** OAuth client (not the CRM client).
2. Keep **`GOOGLE_REVIEWS_REDIRECT_URI=http://localhost:4321/api/google-reviews/callback`** and **`PUBLIC_SITE_URL=http://localhost:4321`** (localhost, not `127.0.0.1`).
3. `npm run dev` → open **http://localhost:4321/google-reviews/setup/**
4. Authorize Google, then **confirm** the correct business location (nothing auto-selects the first result).
5. Tokens and temporary review cache are stored under **`.data/google-reviews/`** (gitignored).

Until authorized, the site shows a clean Google profile link only — never invented ratings.

### Mock vs live CRM

- **Mock** (default): lead API validates and returns a mock `customer_id`. Safe for development. Response includes `"mocked": true`.
- **Live**: real POST to `{CRM}/integrations/api/v1/leads/`. Only use with intentional test protocol — live leads can trigger CRM first-contact automation.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local preview with HMR |
| `npm run build` | Production build |
| `npm run preview` | Serve the build locally |
| `npm test` | Lead + Google reviews regression tests |
| `npm run media:curate` | Copy + compress selected images into `public/images` |
| `npm run check:urls` | Optional URL coverage helper |
| `npm run launch:verify` | Preview smoke: redirects, mock lead, noindex, facts |
| `npm run launch:content-scan` | Claims/boilerplate scan across HTML |
| `npm run launch:lighthouse` | Mobile Lighthouse 3-run medians (preview must be up) |
| `npm run launch:prod-env` | Staging env sanity check |
| `npm run launch:prod-env:strict` | Production env readiness (indexing + live CRM keys) |

## Project docs

- `AGENTS.md` — permanent project instructions
- `docs/build-brief.md` — durable build brief
- `docs/source-inventory.md` — source materials inventory
- `docs/url-migration-manifest.md` — URL outcomes
- `docs/image-catalog.md` / `docs/photo-replacement.md` — media
- `docs/integration-contract.md` — CRM contract (verified / assumptions / gaps)
- `docs/meta-pixel.md` — Meta Pixel PageView install + Render env
- `docs/google-reviews.md` — Google reviews OAuth, cache policy, setup
- `docs/open-questions.md` — non-blocking questions
- `docs/launch-checklist.md` — launch/rollback
- `docs/test-results.md` — test results & blockers
- `docs/crm-doc-proposals.md` — proposed CRM-repo doc updates (not applied)

## Source materials (local only)

Gitignored originals at repo root: WordPress XML, Search Console Excel, `website-media(.zip)`, PHP proxy, design screenshots. Do not stage them.

## Production indexing

1. Set `PUBLIC_SITE_URL` to the public origin.
2. Set `PUBLIC_SITE_INDEXING=true`.
3. Deploy, verify `/robots.txt` allows crawling and `/sitemap.xml` lists retained URLs.
4. Submit sitemap in Search Console after cutover.

Until step 2, previews remain `noindex,nofollow`.
