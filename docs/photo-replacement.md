# Adding or replacing photos

1. Place the original (full resolution, preferred PNG/JPEG with transparency if logo) into a working folder — **do not** dump into git as the entire uploads tree.
2. Add an entry to `scripts/curate-media.mjs` `copies` or hero selection logic with:
   - source relative path under `website-media/uploads/`
   - destination under `public/images/...`
   - alt text and intended use
   - Service-specific one-offs also exist: `scripts/curate-flower-bed-photos.mjs`, `scripts/curate-tree-shrub-care-photo.mjs`
3. Run `npm run media:curate` (or the service-specific script).
4. Update `docs/image-catalog.md` with alt text and usage.
5. Reference the new public path from Astro pages (`src="/images/..."`), preferring `<img>` width/height and webp companions when available.
6. Commit only `public/images/**` curated outputs + catalog docs — never `website-media/` or `website-media.zip`.

## Alt text

- Describe what is actually in the photo.
- Do not invent city names, customer names, or before/after claims.
- Logos/mascot: use brand name; decorative mascot next to text may use empty alt if adjacent text is redundant (homepage already has descriptive copy).
