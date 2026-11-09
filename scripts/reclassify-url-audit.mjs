/**
 * Reclassify from cached probe results after fixing new-route inventory parsing.
 * Does not hit the live site again.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

// Import helpers by re-running inventory pieces inline via dynamic import of the audit module is hard
// because classify isn't exported. Duplicate minimal reclassification using refreshed routes.

const work = path.join(root, ".migration-work");
const outDir = path.join(root, "docs", "migration");
const probeRows = JSON.parse(fs.readFileSync(path.join(work, "probe-rows.json"), "utf8"));

function normalizePath(urlOrPath) {
  try {
    const u = urlOrPath.startsWith("http")
      ? new URL(urlOrPath)
      : new URL(urlOrPath, "https://growgreenweedcontrol.com");
    let p = u.pathname || "/";
    if (!p.endsWith("/") && !/\.[a-z0-9]{2,5}$/i.test(p)) p += "/";
    return p;
  } catch {
    return null;
  }
}

function loadRoutes() {
  const routes = new Map();
  const add = (p, purpose, source) => {
    const n = normalizePath(p);
    if (!n) return;
    if (!routes.has(n)) routes.set(n, { purpose, source });
  };
  const cores = [
    "/",
    "/about-us/",
    "/services/",
    "/contact-us/",
    "/request-a-quote/",
    "/careers/",
    "/privacy-policy/",
    "/terms-and-conditions/",
    "/lawn-care-blog/",
    "/service-areas/",
    "/customer-login-pay-bill/",
    "/thank-you/",
    "/thank-you-nextdoor/",
    "/thank-you-core-aeration/",
    "/liquid-aeration-quote-request-received/",
    "/test/",
  ];
  for (const p of cores) add(p, "core", "pages");

  const servicesTs = fs.readFileSync("src/data/services.ts", "utf8");
  for (const m of servicesTs.matchAll(/slug:\s*"([^"]+)"/g)) add(`/${m[1]}/`, "service", "services");
  const relatedBlock = servicesTs.match(/export const relatedServicePages[\s\S]*?= \{([\s\S]*?)\n\};/);
  if (relatedBlock) {
    for (const m of relatedBlock[1].matchAll(/^\s*"([^"]+)":\s*\{/gm)) add(`/${m[1]}/`, "related", "related");
  }
  const areasTs = fs.readFileSync("src/data/service-areas.ts", "utf8");
  const cut = areasTs.indexOf("serviceAreaHubs");
  for (const m of areasTs.slice(0, cut).matchAll(/^\s+slug:\s*"([^"]+)"/gm)) {
    add(`/service-areas/${m[1]}/`, "service-area", "service-areas");
  }
  const pathRe = /(?:^|\s)(?:path|"path"):\s*"([^"]+)"/gm;
  for (const m of fs.readFileSync("src/data/geo-pages.generated.ts", "utf8").matchAll(pathRe)) {
    add(m[1], "geo", "geo-pages");
  }
  for (const m of fs.readFileSync("src/data/blog-posts.generated.ts", "utf8").matchAll(pathRe)) {
    add(m[1], "blog", "blog-posts");
  }
  for (const m of fs.readFileSync("src/data/campaigns.ts", "utf8").matchAll(/^\s+slug:\s*"([^"]+)"/gm)) {
    add(`/${m[1]}/`, "campaign", "campaigns");
  }
  return routes;
}

const aliasMap = {
  "/contact/": "/contact-us/",
  "/about/": "/about-us/",
  "/privacy/": "/privacy-policy/",
  "/request-/": "/request-a-quote/",
  "/flower-bed-weed-control/": "/flower-bed-weed-control-and-fertilization/",
  "/services/core-aeration/": "/core-aeration/",
  "/services/fire-ant-treatment/": "/fire-ant-treatment/",
  "/services/flower-bed-weed-control/": "/flower-bed-weed-control-and-fertilization/",
  "/services/lawn-fertilization-weed-control/": "/lawn-fertilization-weed-control/",
  "/the-ultimate-guide-to-fertilizing-your-lawn-in-south-Louisiana/":
    "/the-ultimate-guide-to-fertilizing-your-lawn-in-south-louisiana/",
};

const routes = loadRoutes();
fs.writeFileSync(
  path.join(work, "new-routes.json"),
  JSON.stringify({ count: routes.size, routes: [...routes.entries()].sort() }, null, 2),
);

function classify(oldPath, row) {
  const notes = [];
  const isFeed = /\/feed\/?$/.test(oldPath) || oldPath.includes("/comments/feed");
  const isTaxonomy = oldPath.startsWith("/category/") || oldPath.startsWith("/tag/");
  const isWpAdmin =
    oldPath.startsWith("/wp-admin") ||
    oldPath.startsWith("/wp-json") ||
    oldPath.startsWith("/wp-login") ||
    oldPath.startsWith("/wp-content/") ||
    /^\/wp-.*\.php/.test(oldPath) ||
    oldPath === "/xmlrpc.php";

  const exact = routes.get(oldPath);
  const gsc = /gsc:performance|PRIORITY|Seen in GSC/i.test(row.notes || "");

  let classification = "UNRESOLVED";
  let recommended_action = "Owner review";
  let new_url = "";
  let priority = "P3";
  let confidence = "medium";

  if (isWpAdmin || isFeed) {
    classification = "TECHNICAL/UTILITY";
    recommended_action = "Do not recreate; block or 410; CRM leads use /api/leads/website";
    confidence = "high";
  } else if (isTaxonomy) {
    classification = "INTENTIONAL REMOVAL";
    recommended_action = "Do not recreate thin archives; 410/404 after owner review";
    confidence = "high";
    notes.push("WP category/tag archive");
  } else if (exact) {
    classification = "PRESERVED";
    new_url = oldPath;
    recommended_action = "Keep same path on launch; verify content parity";
    priority = /blog|service|campaign|geo|quote|area/.test(exact.purpose) ? "P1" : "P2";
    confidence = "high";
    notes.push(`New purpose: ${exact.purpose} (${exact.source})`);
  } else if (aliasMap[oldPath] && routes.has(aliasMap[oldPath])) {
    classification = "REDIRECT NEEDED";
    new_url = aliasMap[oldPath];
    recommended_action = `301 ${oldPath} → ${aliasMap[oldPath]}`;
    priority = "P1";
    confidence = "high";
  } else if (row.old_status === 404 || row.old_status === 410) {
    classification = "TECHNICAL/UTILITY";
    recommended_action = "Already missing on live WP unless ads/GSC show demand";
    confidence = "high";
  } else {
    const slugGuess = oldPath
      .replace(/^\/|\/$/g, "")
      .replace(
        /lawn-treatment(s)?-service-in-|lawn-treatment-service-|lawn-treatments-|lawn-fertilization-|weed-control-|lawn-treatment-in-|lawn-treatment-/g,
        "",
      )
      .replace(/-la$/, "");
    const saPath = `/service-areas/${slugGuess}/`;
    if (routes.has(saPath)) {
      classification = "REDIRECT NEEDED";
      new_url = saPath;
      recommended_action = `301 to ${saPath} after confirming intent (geo vs city hub)`;
      priority = "P1";
      confidence = "medium";
      notes.push("Slug heuristic → /service-areas/");
    } else if (/facebook|postcard|trucklead|nextdoor|gym-member|estimate-request/i.test(oldPath)) {
      classification = "MISSING PAGE";
      recommended_action = "Implement campaign landing or confirm retirement before 404/410";
      priority = "P1";
      confidence = "medium";
    } else if (/blog|guide|how-to|battling|creating-|importance-|excellent-results|common-lawn/i.test(oldPath)) {
      classification = "MISSING PAGE";
      recommended_action = "Port blog post or redirect to closest article after review";
      priority = "P1";
      confidence = "medium";
    } else if (/lawn-|weed-|fire-ant|tree-|soil-|aeration|mosquito|services|about|contact|careers|request/i.test(oldPath)) {
      classification = "MISSING PAGE";
      recommended_action = "Create equivalent or purposeful redirect — not homepage by default";
      priority = "P1";
      confidence = "low";
    } else if (oldPath.startsWith("/2023/") || oldPath.startsWith("/2024/") || oldPath.startsWith("/2025/")) {
      classification = "INTENTIONAL REMOVAL";
      recommended_action = "Date archive — do not recreate; 410/404";
      confidence = "high";
    } else {
      classification = "UNRESOLVED";
      recommended_action = "Manual content match required";
      priority = "P2";
      confidence = "low";
    }
  }

  if (gsc && (classification === "MISSING PAGE" || classification === "REDIRECT NEEDED")) {
    priority = "P1";
    notes.push("GSC/performance signal in prior notes");
  }
  if (classification === "PRESERVED") new_url = oldPath;

  return {
    ...row,
    new_url,
    classification,
    recommended_action,
    priority,
    confidence,
    notes: [notes.join("; "), row.notes].filter(Boolean).join(" | "),
  };
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const classified = probeRows.map((r) => classify(normalizePath(r.old_url), r));
const columns = [
  "old_url",
  "old_status",
  "final_old_url",
  "title",
  "canonical",
  "indexability",
  "discovery_source",
  "new_url",
  "classification",
  "recommended_action",
  "priority",
  "confidence",
  "notes",
];
fs.writeFileSync(
  path.join(outDir, "url-audit.csv"),
  [columns.join(","), ...classified.map((r) => columns.map((c) => csvEscape(r[c])).join(","))].join("\n"),
);

const counts = {};
for (const r of classified) counts[r.classification] = (counts[r.classification] || 0) + 1;

const missing = classified.filter((r) => r.classification === "MISSING PAGE");
const redirects = classified.filter((r) => r.classification === "REDIRECT NEEDED");
const preserved = classified.filter((r) => r.classification === "PRESERVED");
const unresolved = classified.filter((r) => r.classification === "UNRESOLVED");
const intentional = classified.filter((r) => r.classification === "INTENTIONAL REMOVAL");
const technical = classified.filter((r) => r.classification === "TECHNICAL/UTILITY");
const hostChecks = JSON.parse(fs.readFileSync(path.join(work, "host-checks.json"), "utf8"));

const strip = (u) => u.replace("https://growgreenweedcontrol.com", "");

const summary = `# URL migration audit summary

Generated: ${new Date().toISOString()} (reclassified with corrected new-route inventory)  
Live site verified: **Grow Green Weed Control**  
Canonical hostname: **\`https://growgreenweedcontrol.com\`** (apex HTTPS)

## Host observations

| Request | Status | Location |
| --- | --- | --- |
${hostChecks.map((h) => `| \`${h.url}\` | ${h.status} | ${h.location || "—"} |`).join("\n")}

Server header observed: **LiteSpeed** (KnownHost). \`www\` and \`http\` both redirect to apex HTTPS.

**This audit does not claim complete URL discovery.** Orphans may remain in Search Console, ads, analytics, or server logs.

## Crawl scope

| Source | Result |
| --- | --- |
| robots.txt | Disallow \`/wp-admin/\` (allow admin-ajax); sitemaps \`/sitemap.xml\`, \`/sitemap.rss\` |
| Nested sitemaps | post, page, category, post_tag |
| Seed crawl | \`/\`, \`/services/\`, \`/lawn-care-blog/\`, \`/about-us/\`, \`/contact-us/\`, \`/request-a-quote/\` |
| Repo | \`docs/url-migration-manifest.md\` |
| Unique URLs probed | **${classified.length}** |
| Rate limit | ~350 ms; UA \`GrowGreenMigrationAudit/1.0\` |
| Avoided | wp-admin/login, POSTs, endless query variants |

## New site inventory (local source of truth)

| Item | Count |
| --- | ---: |
| Implemented public paths (pages + data) | **${routes.size}** |
| Trailing slash | Preferred; \`trailingSlash: ignore\` for OAuth callback exception |
| Configured site URL | \`https://growgreenweedcontrol.com\` |
| Pre-launch indexing | \`noindex\` until \`PUBLIC_SITE_INDEXING=true\` |
| Lead intake | \`POST /api/leads/website\` (replaces WP JSON bridge) |

Includes: core pages, services, related service pages, 40 \`/service-areas/{city}/\`, geo legacy paths, blog posts, campaign landings.

## Counts by classification

| Classification | Count |
| --- | ---: |
| PRESERVED | ${preserved.length} |
| REDIRECT NEEDED | ${redirects.length} |
| MISSING PAGE | ${missing.length} |
| INTENTIONAL REMOVAL | ${intentional.length} |
| TECHNICAL/UTILITY | ${technical.length} |
| UNRESOLVED | ${unresolved.length} |
| **Total** | **${classified.length}** |

## Highest-priority gaps

### MISSING PAGE (need content decision)

${
  missing.length
    ? missing
        .map(
          (r) =>
            `- \`${strip(r.old_url)}\` — ${r.title || "(no title)"} — **${r.recommended_action}** (${r.confidence}; ${r.priority})`,
        )
        .join("\n")
    : "_None after reclassification._"
}

### REDIRECT NEEDED (proposed single-hop 301)

Do **not** send these to the homepage. Preserve campaign/query params (\`utm_*\`, \`gclid\`, \`fbclid\`) when implementing on KnownHost/LiteSpeed — inspect actual rewrite config before choosing syntax.

${redirects
  .map((r) => `- \`${strip(r.old_url)}\` → \`${r.new_url}\` — ${r.recommended_action} (${r.confidence})`)
  .join("\n")}

## PRESERVED

**${preserved.length}** URLs share the same path on the new site (services, many geos, blog posts, campaigns, hubs). Spot-check quote forms and attribution at cutover.

## INTENTIONAL REMOVAL / TECHNICAL

- Taxonomy \`/category/*\`, \`/tag/*\`: recommend **410** after owner confirmation (or 404 if no meaningful hits).
- Feeds, \`xmlrpc.php\`, \`wp-admin\`, \`wp-json\`: do not recreate; CRM uses website API.
- Date archives (\`/2023/01/\`): do not recreate.

## UNRESOLVED

${unresolved.map((r) => `- \`${strip(r.old_url)}\` (${r.old_status}) ${r.title}`).join("\n") || "_None_"}

## Launch blockers (owner / ops)

1. Confirm redirects for \`/services/{service}/\` aliases and short paths (\`/about/\`, \`/flower-bed-weed-control/\`).
2. Confirm whether legacy **fertilization/weed-control city** URLs 301 to \`/service-areas/{city}/\` or keep dedicated geo pages already in \`geo-pages.generated\`.
3. Confirm taxonomy 410 vs 404.
4. Implement redirects on **KnownHost/LiteSpeed** using the live vhost tools/\`.htaccess\`/app layer — do not assume plan features.
5. Keep indexing off until redirect + parity QA passes.
6. Later regression checks: preserved 200s; single-hop redirects; query passthrough; quote/CRM source fields; no loops.

## Limits

- Public sitemap + link + manifest crawl only.
- Title/canonical via HTML regex.
- No deployed-new-site headers measured (local inventory only).
- No traffic/revenue ranking claimed without GSC export attachment beyond existing manifest flags.

## MCP / Academy

Audit-only — **no MCP/Academy updates required** unless later redirect work changes CRM landing URLs or attribution contracts.

## Artifacts

- \`docs/migration/url-audit.csv\`
- \`docs/migration/url-audit-summary.md\`
- Cached probes: \`.migration-work/\` (gitignored)
`;

fs.writeFileSync(path.join(outDir, "url-audit-summary.md"), summary);
console.log("counts", counts);
console.log("routes", routes.size);
console.log(
  "missing",
  missing.map((r) => strip(r.old_url)),
);
console.log(
  "redirects",
  redirects.map((r) => `${strip(r.old_url)} => ${r.new_url}`),
);
