# Link & asset audit — 2026-11-09

## Internal links / images (automated same-origin)

| Metric | Result |
| --- | --- |
| Pages crawled | 138 |
| Broken same-origin link rows | **0** |
| Broken same-origin image rows | **0** |
| Detail CSV | `link-audit.csv` (empty of failures) |

Every public HTML page in the inventory had its internal anchors and `<img src>` checked against production with status caching.

## Critical external / special links (spot-checked)

| Link type | Sample | Result |
| --- | --- | --- |
| Phone | `tel:+12254613199` | Present sitewide |
| Email | `mailto:office@growgreenweedcontrol.com` | Present |
| Portal | `https://portal.growgreenweedcontrol.com/portal/` | Correct destination |
| Google reviews profile | `https://share.google/kswC3aN1uIXDHrvAc` | Present; reviews API live |
| Social (FB/IG/Nextdoor/YT) | Footer | Present (third-party reachability **unverified** beyond href) |
| Maps / directions | Footer “Get directions” | Present |

## Host / protocol

| Check | Result |
| --- | --- |
| `http://` → `https://` | 301 |
| `www` → apex | 301 |
| Trailing-slash aliases | Mostly ignored / normalized; dedicated redirects for legacy aliases |

## Soft 404 / redirect notes

- Unknown paths → branded 404 (noindex).
- Capital-L fertilizing guide → **hard 404** on prod (see F-01), not soft-200.
- Retired WP archives → 404 (not 410).
