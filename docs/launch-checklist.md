# Launch / rollback checklist

## Before DNS cutover

- [ ] Full backup of current WordPress (files + DB) and note restore path
- [ ] Confirm URL migration manifest reviewed (retained / 301 / 410)
- [ ] Review `docs/launch/launch-readiness.md` (local build ready; production verification pending)
- [ ] Staging preview with `PUBLIC_SITE_INDEXING=false` (must stay noindex)
- [ ] Visual QA: home, service, city, blog (pickers + fertilizing guide), campaign, contact, quote, careers, 404 — desktop + mobile
- [ ] Lead API mock tests green (`npm test`)
- [ ] Controlled **live** CRM verification on staging with one known test lead (office aware); confirm promotional SMS consent + attribution fields land correctly; confirm automation does **not** double-send welcome texts from website
- [ ] Map token restricted to production/staging origins
- [ ] SSL certificate ready on new host
- [ ] Node standalone process confirmed on KnownHost (see `docs/launch/hosting-knownhost.md`) — not static-only upload
- [ ] Redirect map implemented in app (SSR redirect pages) **and** optionally at LiteSpeed edge
- [ ] Meta Pixel: set `PUBLIC_META_PIXEL_ID=1014961828315598` on production host and rebuild (see `docs/meta-pixel.md`); GTM/GA4 still deferred
- [ ] Careers live mode: CRM public openings/applications reachable from production host; confirm openings appear when hiring
- [ ] Re-run `npm run launch:crawl` + lighthouse batch against production URL after deploy

## Cutover

- [ ] Deploy production build
- [ ] Set `PUBLIC_SITE_URL`, `PUBLIC_SITE_INDEXING=true`, `PUBLIC_META_PIXEL_ID`, live CRM env vars
- [ ] Point DNS; verify HTTPS
- [ ] Smoke: homepage, quote submit (one controlled lead), portal link, phone/email, sitemap, robots
- [ ] Submit sitemap in Search Console
- [ ] Monitor 404s / CRM lead inbox for 48 hours

## Rollback

- [ ] Re-point DNS to WordPress host (or previous origin)
- [ ] Keep new host warm for re-attempt
- [ ] Document any leads captured only on new stack during window
- [ ] Restore WP from backup only if files/DB were modified (this project should not have touched live WP)

## Out of scope for this repo alone

DNS changes, live CRM credential installation, portal changes, and publishing CRM Academy docs require separate owner actions.
