# Image catalog (shipped)

Curated assets live in `public/images/`. Raw WordPress uploads remain in gitignored `website-media/`.

## Brand logo (only set in use)

| Path | Alt / use | Notes |
| --- | --- | --- |
| `/images/brand/logo.png` | Grow Green Weed Control logo | Owner-supplied Full-Glow transparent (canonical header/footer) |
| `/images/brand/logo-full-glow.png` | Full-Glow logo | Same asset, explicit filename |
| `/images/brand/logo-160.png` … `logo-640.png` | Sized logo copies | Same Full-Glow source |
| `/images/brand/favicon.png` | Favicon (180), full thumbs-up mascot | Tab / apple-touch icon |
| `/images/brand/favicon-32.png` | Favicon 32×32, full thumbs-up mascot | Tab icon |
| `/images/brand/favicon-48.png` | Favicon 48×48, full thumbs-up mascot | Tab icon |

Older logo variants (`logo-mark`, `logo-words`, `/images/logos/*`, campaign logo copies) were removed. Do not reintroduce them.

## Mascots (only set in use)

All paths under `/images/mascot/`. Original owner art — do not redraw or distort.

| Path | Typical use |
| --- | --- |
| `backpack-sprayer.png` | Homepage hero, contact hero, campaign |
| `thumbs-up.png` | Cards, brand strip, service form companion |
| `waving.png` | Trust / welcome moments |
| `pointing.png` | CTAs / “you’re next” |
| `spray-wand.png` | Service pages (treatment) |
| `spreader.png` | Fertilization / program pages |
| `checklist.png` | Estimate / soil / plan checklists |
| `five-stars.png` | Reviews / Google listing |
| `thinking.png` | FAQ / help |
| `firefighter.png` | Careers / firefighter-owned identity |
| `watering.png` | Lawn care / aftercare |
| `bed-spot-treat.png` (+ `*-216/320/480.webp`) | Flower bed program — spot-treating weeds near ornamentals |
| `fire-ants.png` | Fire ant service |
| `mushroom-weed.png` | Weed / disease storytelling |
| `lush-lawn.png` | Results / coverage |
| `lawn-app.png` | Customer portal / account |
| `aerator.png` | Aeration services |
| `weed-hero.png` | Weed control hero moments |
| `appointment.png` | Scheduling / reminders |
| `hooray.png` | Success / celebration |
| `angry.png` | Problem / pest moments |
| `oh-no.png` | Problem awareness |
| `exhausted.png` | DIY fatigue storytelling |
| `tears.png` | Dramatic “before” humor (use sparingly) |

## Photography & other media

| Path | Alt / use | Notes |
| --- | --- | --- |
| `/images/home/hero-lawn.webp` | Homepage hero lawn + yard sign | From WP `2025/10/Untitled-design.jpg` |
| `/images/home/video-poster.webp` | Dereck intro video poster | From WP `2025/10/video_thumb_00_01.jpg` |
| `/videos/dereck-intro.mp4` | Owner intro video | From WP `2025/10/Hello-Im-Dereck-with-Grow-Green-Weed-Control-1.mp4` |
| `/images/services/zoysia.webp` | Zoysia lawn service card | From WP `2022/09/zoysia.jpg` |
| `/images/about/owner-family.jpg` (+ webp/sizes) | Owner Dereck Palermo with his son | From WP 2026/04 upload |
| `/images/hero/lawn-hero.jpg` (+ webp) | Supporting lawn photography | From WP `lawn-treatment-ascension-parish-scaled.jpg` — not labeled as a specific customer property |
| `/images/hero/cover.webp` | Homepage hero background | Authentic lush lawn + yard sign |
| `/images/services/*.webp` | Service card photography | Ant mound, mosquito, soil sampling, core aeration |
| `/images/services/lawn-insects-damage-*.webp` | Lawn insects hero / damage example | Owner photo: brown turf patch beside sidewalk; do not invent pest ID in alt |
| `/images/services/lawn-fungus-large-patch*.webp` | Lawn fungus hero, Large Patch card, hub | Owner photo: circular yellow-brown patch in St. Augustine; labeled large patch |
| `/images/services/flower-beds/*` | Flower bed weed-control page photography | Owner bed photos; SEO slugs + alt in page; `-480/-640/-960.webp` + `-960.jpg`; shared card at `/images/services/flower-bed-card.webp` |
| ~~`/images/services/flower-bed.*`~~ | Removed | Legacy flower-bed hero/card set deleted Nov 2026 |
| `/images/about/kyle-tree-shrub-care.webp` | Tree & shrub card | Authentic tech/ornamental photo |
| `/images/about/kyle-robison.webp` | Kyle Robison, lead technician | Team portrait for About |
| `/images/about/gavin-broussard.webp` | Gavin Broussard, technician | Team portrait for About |
| `/images/about/moses-sunseri.webp` | Moses Sunseri, office administrator | Team portrait for About |
| `/images/about/chase-specialty-tech.webp` | Chase, specialty technician | Team portrait for About |
| `/images/about/stuart-technician.webp` | Stuart, technician | Team portrait for About |
| `/images/hero/truck.jpg` (+ webp) | Company truck | From WP `F250-2018-Pickup-Truck-Side-View.jpg` |
| `/images/hero/cover.jpg` | Cover / social imagery | From WP `Grow-Green-Weed-Control-Cover.jpg` |
| `/images/campaigns/facebook-nov/lawn-sign.jpg` | Lawn + yard sign | Campaign photography |
| `/images/campaigns/facebook-nov/community.jpeg` | Community / firefighter event | From WP `IMG_4748.jpeg` |
| `/images/campaigns/facebook-nov/truck.jpg` | Branded F-250 side view | From WP 2026/11 truck upload |
| `/images/service-areas/prairieville.webp` | Grow Green team and mascot at a Prairieville community event | Owner photo; also `.jpg` + 640/960/1280 webp |
| `/images/service-areas/grow-green-*-{nn}.webp` | Owner lawn / truck / property photos for local pages | SEO filenames; `-480.webp` companions; legacy `pool-{nn}.webp` copies kept |
| `/images/parishes/*-{640,960,1280}.webp` (+ `-1280.jpg`) | Parish hub heroes/gallery | Owner lawn/treatment photos; SEO filenames; alt/captions in `src/data/parish-media.ts` + `manifest.json` — do not invent city claims in alt text |
| `/images/brand/logo-64.webp` / `logo-128.webp` / `logo-192.webp` | Header/footer logo ladder | Replaces shipping full `logo.png` in chrome |
| `/images/mascot/*-216.webp` / `*-240.webp` / `*-320.webp` / `*-480.webp` | Display-sized mascot WebPs | Prefer over full PNGs above the fold |
| `/images/home/hero-lawn-{640,960,1280,1600}.webp` | Homepage / lawn-service hero ladder | CSS/`picture` select by viewport |
| `/images/blog/*-640.webp` | Blog hero / card thumbnails | One per published post |
| `/images/blog/inline/*.{webp,jpg,png}` | Original WP inline article photos | Restored via `npm run media:curate-blog`; mapped in `src/data/blog-inline-images.ts` |
| `/fonts/nunito-sans-latin.woff2` | Self-hosted Nunito Sans | Preloaded; replaces Google Fonts CSS request |

Machine-readable export: `docs/image-catalog.generated.json` (may lag until regenerated).

## Service-area photos

Assignments live in `src/data/service-area-images.ts` (merged onto every city page via `getServiceAreaPage`).

**SEO / optimization fields**

| Field | Behavior |
| --- | --- |
| Filename | `grow-green-lawn-care-*`, `grow-green-home-lawn-*`, `grow-green-service-truck-*` |
| `alt` | Unique per photo — describes what is visible (never invents a city location) |
| `caption` / `title` | Page-local service copy naming the city (service area, not “photo taken in”) |
| `width` / `height` | Intrinsic pixel size (sources are 480×640; Prairieville community is 1024×768) |
| `srcset` / `sizes` | Full + 480w (or 640w for Prairieville) |
| `og:image` | Primary gallery photo |
| JSON-LD | `ImageGallery` + `ImageObject` (`caption`, `description`, dims) |
