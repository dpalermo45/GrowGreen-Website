# Open questions (non-blocking)

Recorded for later owner review. Core site proceeds without these.

1. **Social proof claims** present on current WP pages: “600+ local lawns,” “4.9-star” Google rating, “satisfaction guaranteed,” “no long-term contracts.” Confirm which remain accurate for public display. Homepage omits 600+/4.9/guarantee wording; live marketing now uses seasonal-visit / billing-options language until owner confirms exact “8 visits” and contract terms.
2. **Google reviews connection** — first-party Business Profile OAuth + temporary cache is implemented (`docs/google-reviews.md`). Live ratings appear only after local website-client authorization and location confirmation. Trustindex remains unused.
3. **Form page code.txt** holds the November Facebook Divi module; **careers page code.txt** holds the careers Divi extract. Confirm whether other campaign landings still need separate Divi exports.
4. **CRM acceptance response schema:** exact required fields beyond HTTP status / `customer.id` for treating a lead as accepted. MCP lead docs were not available in this workspace.
5. **CRM SMS consent field:** whether a dedicated opt-in field exists (current proxy only puts status in notes).
6. **Browser-supplied fields** (custom notes, UTM, fbclid): which CRM fields/notes lines are supported without inventing schema.
7. **Careers applications:** verified Divi destination is CRM public APIs (`/api/public/careers/openings/` + `/applications/`), proxied via website `/api/careers/*`. Live CRM currently returns zero openings — confirm when hiring resumes.
8. **Mapbox** — local `.env` now has a public token for address autocomplete; confirm a production-restricted token before launch.
9. **November Facebook offer** — coded to auto-expire after 2026-11-30 America/Chicago (`expiresAt` on facebook-50 / facebook-estimate). Confirm if the office wants an earlier cutoff.
10. **“test” page** (`/test/`): retire (410) vs remove from sitemap only?
11. **Customer login page** content vs hard redirect to portal URL.
12. Preferred production host (Netlify / Cloudflare / VPS) — affects adapter deploy notes only.
13. Whether owner photo of Dereck with son may remain hero/about imagery (present in WP media with alt text).
