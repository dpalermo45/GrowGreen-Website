# KnownHost / production hosting notes

## Confirmed architecture (this repo)

| Item | Requirement |
| --- | --- |
| Runtime | **Node.js ≥ 20** (Astro `@astrojs/node` standalone) |
| Build | `npm ci && npm run build` |
| Start | `node ./dist/server/entry.mjs` (or process manager wrapping that) |
| Static assets | Served from `dist/client/` by the Node adapter |
| APIs | `/api/leads/website`, `/api/careers/*`, `/api/google-reviews/*` require the Node process |

**Do not** treat this site as static-only `dist/` upload. Lead intake, careers proxy, and Google reviews refresh need the Node server.

## Environment (production)

Validate locally before deploy:

```bash
npm run launch:prod-env          # preview/staging expectations
npm run launch:prod-env:strict   # requires indexing + live CRM keys present
```

Set on the host (never commit):

- `PUBLIC_SITE_URL=https://growgreenweedcontrol.com`
- `PUBLIC_SITE_INDEXING=true` — required to drop `noindex` and allow `robots.txt` / sitemap URLs
- `GGWC_CRM_MODE=live`
- `GGWC_CRM_BASE_URL`, `GGWC_CRM_API_KEY`
- `PUBLIC_MAPBOX_TOKEN` (origin-restricted)
- `PUBLIC_META_PIXEL_ID=1014961828315598` (PageView; rebuild required — see `docs/meta-pixel.md`)
- Google reviews vars per `.env.example` / `docs/google-reviews.md`
- `GOOGLE_REVIEWS_SETUP_ENABLED=false` in production unless using setup token

## LiteSpeed / reverse proxy

If LiteSpeed sits in front of Node:

1. Proxy all traffic (or at least HTML + `/api/*`) to the Node listen port.
2. Preserve `Host`, `X-Forwarded-For`, `X-Forwarded-Proto`.
3. Terminate TLS at LiteSpeed; Node may listen on localhost only.
4. Do **not** cache `POST /api/*` or HTML thank-you / quote responses aggressively.
5. Mirror critical 301 aliases at the edge (belt-and-suspenders with app redirects). Install `deploy/litespeed-redirects.conf` on the vhost (or paste the RewriteRules). Suggested map:

| From | To |
| --- | --- |
| `/about/` | `/about-us/` |
| `/contact/` | `/contact-us/` |
| `/privacy/` | `/privacy-policy/` |
| `/request-/` | `/request-a-quote/` |
| `/flower-bed-weed-control/` | `/flower-bed-weed-control-and-fertilization/` |
| `/pre-emergent-weed-control/` | `/lawn-fertilization-weed-control/` |
| `/lawn-treatment-denham-springs/` | `/service-areas/denham-springs/` |
| `/services/core-aeration/` | `/core-aeration/` |
| `/services/fire-ant-treatment/` | `/fire-ant-treatment/` |
| `/services/flower-bed-weed-control/` | `/flower-bed-weed-control-and-fertilization/` |
| `/services/lawn-fertilization-weed-control/` | `/lawn-fertilization-weed-control/` |

Query strings (UTM, fbclid) must be preserved on redirects.

## Verification status

| Check | Status |
| --- | --- |
| Local Node preview with redirects | PASS (301 from redirect pages) |
| Local mock lead `POST /api/leads/website` | PASS (`201` + `mocked: true`) |
| Live KnownHost Node process | **BLOCKED** — not deployed from this audit |
| Live CRM lead acceptance | **BLOCKED** — needs controlled live test on host |
| Apex/www + HTTPS | **BLOCKED** — DNS/host not changed |
| LiteSpeed proxy rules | **BLOCKED** — owner/host config |

## Rollback

Re-point DNS / reverse proxy to the current WordPress origin. Keep the Node host warm. Document any leads captured only on the new stack during the window.
