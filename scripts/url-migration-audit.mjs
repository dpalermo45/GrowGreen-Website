/**
 * Live WordPress vs new Astro URL migration audit.
 * Read-only: rate-limited GET/HEAD against growgreenweedcontrol.com + local route inventory.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const work = path.join(root, ".migration-work");
const outDir = path.join(root, "docs", "migration");
fs.mkdirSync(work, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const ORIGIN = "https://growgreenweedcontrol.com";
const UA = "GrowGreenMigrationAudit/1.0 (+local read-only audit; rate-limited)";
const DELAY_MS = 350;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function extractLocs(xml) {
  const out = [];
  const re = /<loc>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/loc>/gis;
  let m;
  while ((m = re.exec(xml))) {
    const u = m[1].trim();
    if (u) out.push(u);
  }
  return out;
}

function normalizePath(urlOrPath) {
  try {
    const u = urlOrPath.startsWith("http")
      ? new URL(urlOrPath)
      : new URL(urlOrPath, ORIGIN);
    if (u.hostname.replace(/^www\./, "") !== "growgreenweedcontrol.com") return null;
    let p = u.pathname || "/";
    if (!p.endsWith("/") && !/\.[a-z0-9]{2,5}$/i.test(p)) p += "/";
    return p;
  } catch {
    return null;
  }
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function fetchText(url, opts = {}) {
  const res = await fetch(url, {
    redirect: opts.redirect || "manual",
    headers: { "User-Agent": UA, Accept: "text/html,application/xml;q=0.9,*/*;q=0.8" },
    ...opts.fetchOpts,
  });
  const text = opts.skipBody ? "" : await res.text();
  return { res, text, headers: res.headers };
}

async function probe(url) {
  const chain = [];
  let current = url;
  let finalUrl = url;
  let status = 0;
  let html = "";
  let title = "";
  let canonical = "";
  let robotsMeta = "";
  let indexability = "unknown";
  let error = "";

  try {
    for (let hop = 0; hop < 6; hop++) {
      await sleep(DELAY_MS);
      const { res, text, headers } = await fetchText(current, { redirect: "manual" });
      status = res.status;
      const loc = headers.get("location");
      chain.push({ url: current, status, location: loc || "" });
      if ([301, 302, 303, 307, 308].includes(status) && loc) {
        current = new URL(loc, current).toString();
        continue;
      }
      finalUrl = current;
      html = text;
      break;
    }

    if (status >= 200 && status < 300 && html) {
      const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      title = t ? t[1].replace(/\s+/g, " ").trim() : "";
      const c =
        html.match(
          /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
        ) ||
        html.match(
          /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i,
        );
      canonical = c ? c[1].trim() : "";
      const r = html.match(
        /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i,
      );
      robotsMeta = r ? r[1].toLowerCase() : "";
      if (status === 404 || status === 410) indexability = "not-indexable";
      else if (robotsMeta.includes("noindex")) indexability = "noindex";
      else indexability = "indexable-likely";
    } else if (status === 404 || status === 410) {
      indexability = "not-indexable";
    } else if (status >= 400) {
      indexability = "error";
    }
  } catch (e) {
    error = String(e.message || e);
    indexability = "crawl-failed";
  }

  return {
    old_url: url,
    old_status: status,
    final_old_url: finalUrl,
    title,
    canonical,
    robotsMeta,
    indexability,
    redirect_chain: chain,
    error,
  };
}

function loadLocalNewRoutes() {
  const routes = new Map(); // path -> { purpose, source }

  const add = (p, purpose, source) => {
    const n = normalizePath(p);
    if (!n) return;
    if (!routes.has(n)) routes.set(n, { purpose, source });
  };

  const cores = [
    ["/", "homepage", "pages/index"],
    ["/about-us/", "about", "pages/about-us"],
    ["/services/", "services hub", "pages/services"],
    ["/contact-us/", "contact", "pages/contact-us"],
    ["/request-a-quote/", "quote", "pages/request-a-quote"],
    ["/careers/", "careers", "pages/careers"],
    ["/privacy-policy/", "legal", "pages/privacy-policy"],
    ["/terms-and-conditions/", "legal", "pages/terms-and-conditions"],
    ["/lawn-care-blog/", "blog hub", "pages/lawn-care-blog"],
    ["/service-areas/", "service areas hub", "pages/service-areas/index"],
    ["/customer-login-pay-bill/", "portal bridge", "pages/customer-login-pay-bill"],
    ["/thank-you/", "thank you", "pages/[slug]"],
    ["/thank-you-nextdoor/", "thank you", "pages/[slug]"],
    ["/thank-you-core-aeration/", "thank you", "pages/[slug]"],
    ["/liquid-aeration-quote-request-received/", "thank you", "pages/[slug]"],
    ["/test/", "utility/test (noindex intended)", "pages/[slug]"],
  ];
  for (const [p, purpose, source] of cores) add(p, purpose, source);

  // Parse TS/JS data files with light regex (avoid TS import complexity)
  const servicesTs = fs.readFileSync(path.join(root, "src/data/services.ts"), "utf8");
  for (const m of servicesTs.matchAll(/slug:\s*"([^"]+)"/g)) {
    add(`/${m[1]}/`, "service", "data/services");
  }
  for (const m of servicesTs.matchAll(/"slug":\s*"([^"]+)"/g)) {
    add(`/${m[1]}/`, "related service", "data/services.related");
  }
  // relatedServicePages keys
  const relatedBlock = servicesTs.match(/export const relatedServicePages[\s\S]*?= \{([\s\S]*?)\n\};/);
  if (relatedBlock) {
    for (const m of relatedBlock[1].matchAll(/^\s*"([^"]+)":\s*\{/gm)) {
      add(`/${m[1]}/`, "related service", "data/relatedServicePages");
    }
  }

  const areasTs = fs.readFileSync(path.join(root, "src/data/service-areas.ts"), "utf8");
  const cut = areasTs.indexOf("serviceAreaHubs");
  const citySrc = cut > 0 ? areasTs.slice(0, cut) : areasTs;
  for (const m of citySrc.matchAll(/^\s+slug:\s*"([^"]+)"/gm)) {
    add(`/service-areas/${m[1]}/`, "service area city", "data/service-areas");
  }
  // hubs may not have pages yet
  for (const m of areasTs.slice(cut).matchAll(/^\s+slug:\s*"([^"]+)"/gm)) {
    // note only — not automatically built as pages unless content exists
  }
  for (const m of areasTs.matchAll(/existingUrl:\s*"([^"]+)"/g)) {
    add(m[1], "legacy geo alias target exists as existingUrl", "data/service-areas.existingUrl");
  }

  const pathRe = /(?:^|\s)(?:path|"path"):\s*"([^"]+)"/gm;
  const geo = fs.readFileSync(path.join(root, "src/data/geo-pages.generated.ts"), "utf8");
  for (const m of geo.matchAll(pathRe)) add(m[1], "geo landing (legacy WP path)", "data/geo-pages");

  const blog = fs.readFileSync(path.join(root, "src/data/blog-posts.generated.ts"), "utf8");
  for (const m of blog.matchAll(pathRe)) add(m[1], "blog post", "data/blog-posts");

  const camps = fs.readFileSync(path.join(root, "src/data/campaigns.ts"), "utf8");
  for (const m of camps.matchAll(/^\s+slug:\s*"([^"]+)"/gm)) {
    add(`/${m[1]}/`, "campaign / paid landing", "data/campaigns");
  }

  // Dist check if present (Astro node build may use dist/client)
  const distCandidates = [path.join(root, "dist", "client"), path.join(root, "dist")];
  let builtPaths = [];
  for (const dist of distCandidates) {
    if (!fs.existsSync(dist)) continue;
    const walk = (dir, base = "") => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        if (ent.name.startsWith(".") || ent.name === "node_modules") continue;
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          walk(full, path.posix.join(base, ent.name));
        } else if (ent.name === "index.html") {
          let pp = base ? `/${base}/` : "/";
          pp = pp.replace(/\\/g, "/");
          builtPaths.push(pp);
        }
      }
    };
    walk(dist);
  }
  builtPaths = [...new Set(builtPaths)];

  return { routes, builtPaths };
}

function parseManifest() {
  const md = fs.readFileSync(path.join(root, "docs/url-migration-manifest.md"), "utf8");
  const rows = [];
  for (const line of md.split("\n")) {
    const m = line.match(/^\|\s*`([^`]+)`\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]*)\|\s*([^|]*)\|/);
    if (!m) continue;
    if (m[1] === "Path") continue;
    rows.push({
      path: m[1].trim(),
      outcome: m[2].trim(),
      status: m[3].trim(),
      notes: m[4].trim(),
      sources: m[5].trim(),
    });
  }
  return rows;
}

function extractInternalLinks(html, baseUrl) {
  const out = new Set();
  const re = /href=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = m[1];
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    if (href.includes("wp-admin") || href.includes("wp-login")) continue;
    try {
      const u = new URL(href, baseUrl);
      if (u.hostname.replace(/^www\./, "") !== "growgreenweedcontrol.com") continue;
      if (u.search && /utm_|fbclid|gclid|page_id=|s=/.test(u.search)) {
        // keep path only for inventory; query variants not crawled endlessly
      }
      const p = normalizePath(u.toString());
      if (p && !/\.(jpg|jpeg|png|gif|webp|svg|pdf|css|js|zip|xml)$/i.test(p)) out.add(ORIGIN + p);
    } catch {
      /* ignore */
    }
  }
  return [...out];
}

function classify(oldPath, probeRow, newRoutes, manifestRow) {
  const notes = [];
  let classification = "UNRESOLVED";
  let recommended_action = "Owner review";
  let new_url = "";
  let priority = "P3";
  let confidence = "medium";

  const isFeed = /\/feed\/?$/.test(oldPath) || oldPath.includes("/comments/feed");
  const isTaxonomy = oldPath.startsWith("/category/") || oldPath.startsWith("/tag/");
  const isWpAdmin =
    oldPath.startsWith("/wp-admin") ||
    oldPath.startsWith("/wp-json") ||
    oldPath.startsWith("/wp-login") ||
    oldPath.startsWith("/wp-content/") ||
    /^\/wp-.*\.php/.test(oldPath);

  const exact = newRoutes.routes.has(oldPath) ? newRoutes.routes.get(oldPath) : null;

  // Known redirect aliases from manifest / product knowledge
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

  // Geo pages often move from /lawn-treatment-... to /service-areas/{slug}/
  const geoAliasHints = [];
  for (const [p, meta] of newRoutes.routes) {
    if (meta.purpose.includes("geo") || meta.purpose.includes("service area")) {
      /* keep for matching */
    }
  }

  if (isWpAdmin || isFeed) {
    classification = "TECHNICAL/UTILITY";
    recommended_action = "Do not recreate; block or 410; keep CRM API on new /api/leads/website only";
    priority = "P3";
    confidence = "high";
  } else if (isTaxonomy) {
    classification = "INTENTIONAL REMOVAL";
    recommended_action = "Do not recreate thin archives; 410 or noindex; content lives on posts/pages";
    priority = "P3";
    confidence = "high";
    notes.push("WP category/tag archive");
  } else if (exact) {
    classification = "PRESERVED";
    new_url = ORIGIN.replace("https://growgreenweedcontrol.com", "") + oldPath;
    new_url = oldPath;
    recommended_action = "Keep same path on launch; verify content parity";
    priority = /blog|post/.test(exact.purpose)
      ? "P1"
      : /service|quote|campaign|geo|area/.test(exact.purpose)
        ? "P1"
        : "P2";
    confidence = "high";
    notes.push(`New purpose: ${exact.purpose} (${exact.source})`);
  } else if (aliasMap[oldPath] && newRoutes.routes.has(aliasMap[oldPath])) {
    classification = "REDIRECT NEEDED";
    new_url = aliasMap[oldPath];
    recommended_action = `301 ${oldPath} → ${aliasMap[oldPath]}`;
    priority = "P1";
    confidence = "high";
  } else if (manifestRow?.outcome === "redirected") {
    classification = "REDIRECT NEEDED";
    const dest = (manifestRow.notes.match(/→\s*(\/[^\s→]+)/) || [])[1] || "";
    new_url = dest;
    recommended_action = dest ? `301 to ${dest}` : "Confirm redirect target from manifest";
    priority = "P2";
    confidence = "medium";
    notes.push(`Manifest: ${manifestRow.notes}`);
  } else if (manifestRow?.outcome === "retired" || manifestRow?.outcome === "intentionally_excluded") {
    classification = "INTENTIONAL REMOVAL";
    recommended_action = manifestRow.notes || "Exclude from new site";
    priority = "P3";
    confidence = "medium";
  } else if (probeRow.old_status === 404 || probeRow.old_status === 410) {
    classification = "TECHNICAL/UTILITY";
    recommended_action = "Already missing on live WP; no migration unless GSC shows meaningful demand";
    priority = "P3";
    confidence = "high";
    notes.push("Live status not found");
  } else {
    // Heuristic content matching for geo landings → /service-areas/
    const slugGuess = oldPath
      .replace(/^\/|\/$/g, "")
      .replace(/lawn-treatment(s)?-service-in-|lawn-treatment-service-|lawn-treatments-|lawn-fertilization-|weed-control-|lawn-treatment-in-|lawn-treatment-/g, "")
      .replace(/-la$/, "")
      .replace(/parish$/, "parish");

    const saPath = `/service-areas/${slugGuess}/`;
    const saAlt = `/service-areas/${slugGuess.replace(/_/g, "-")}/`;
    if (newRoutes.routes.has(saPath) || newRoutes.routes.has(saAlt)) {
      classification = "REDIRECT NEEDED";
      new_url = newRoutes.routes.has(saPath) ? saPath : saAlt;
      recommended_action = `301 to equivalent service-area page ${new_url} (verify content intent)`;
      priority = "P1";
      confidence = "medium";
      notes.push("Matched by slug heuristic to /service-areas/");
    } else if (
      /facebook|postcard|trucklead|nextdoor|gym-member|estimate-request|request-an-estimate/i.test(
        oldPath,
      )
    ) {
      classification = "MISSING PAGE";
      recommended_action = "Implement campaign landing or confirm retirement before 404/410";
      priority = "P1";
      confidence = "medium";
      notes.push("Looks like paid/lead landing — high care for attribution");
    } else if (/blog|guide|how-to|battling|creating-|importance-|excellent-results|common-lawn/i.test(oldPath)) {
      classification = "MISSING PAGE";
      recommended_action = "Port blog post or redirect to closest article after review";
      priority = "P1";
      confidence = "medium";
    } else if (/lawn-|weed-|fire-ant|tree-|soil-|aeration|mosquito|services|about|contact|careers|request/i.test(oldPath)) {
      classification = "MISSING PAGE";
      recommended_action = "Create equivalent page or choose purposeful redirect — not homepage by default";
      priority = "P1";
      confidence = "low";
    } else {
      classification = "UNRESOLVED";
      recommended_action = "Manual content match required";
      priority = "P2";
      confidence = "low";
    }
  }

  // Upgrade priority for GSC performance notes
  if (manifestRow?.sources?.includes("gsc:performance") || /PRIORITY/i.test(manifestRow?.notes || "")) {
    if (priority === "P3") priority = "P2";
    if (classification === "MISSING PAGE" || classification === "REDIRECT NEEDED") priority = "P1";
    notes.push("Seen in GSC performance / priority notes");
  }

  if (classification === "PRESERVED") new_url = oldPath;

  return { classification, recommended_action, new_url, priority, confidence, notes: notes.join("; ") };
}

async function main() {
  console.log("Canonical host check...");
  const hostChecks = [];
  for (const u of [
    "https://growgreenweedcontrol.com/",
    "https://www.growgreenweedcontrol.com/",
    "http://growgreenweedcontrol.com/",
  ]) {
    await sleep(DELAY_MS);
    const { res, headers } = await fetchText(u, { redirect: "manual", skipBody: true });
    hostChecks.push({
      url: u,
      status: res.status,
      location: headers.get("location") || "",
      server: headers.get("server") || "",
    });
  }
  fs.writeFileSync(path.join(work, "host-checks.json"), JSON.stringify(hostChecks, null, 2));

  // Sitemaps
  const nested = [
    "post-sitemap.xml",
    "page-sitemap.xml",
    "category-sitemap.xml",
    "post_tag-sitemap.xml",
  ];
  const sitemapUrls = new Set();
  for (const f of nested) {
    const xml = fs.readFileSync(path.join(work, f), "utf8");
    for (const loc of extractLocs(xml)) sitemapUrls.add(loc);
  }

  // Seed crawl from homepage + a few hubs
  const seeds = [
    ORIGIN + "/",
    ORIGIN + "/services/",
    ORIGIN + "/lawn-care-blog/",
    ORIGIN + "/about-us/",
    ORIGIN + "/contact-us/",
    ORIGIN + "/request-a-quote/",
  ];
  const linked = new Set(sitemapUrls);
  for (const seed of seeds) {
    await sleep(DELAY_MS);
    try {
      const { res, text } = await fetchText(seed, { redirect: "follow" });
      if (res.ok) extractInternalLinks(text, seed).forEach((u) => linked.add(u));
    } catch (e) {
      console.warn("seed fail", seed, e.message);
    }
  }

  // Manifest paths
  const manifest = parseManifest();
  const manifestByPath = Object.fromEntries(manifest.map((r) => [normalizePath(r.path) || r.path, r]));
  for (const r of manifest) {
    const p = normalizePath(r.path);
    if (p && !p.includes("*") && !p.includes("wp-")) linked.add(ORIGIN + p);
  }

  const newInv = loadLocalNewRoutes();
  fs.writeFileSync(
    path.join(work, "new-routes.json"),
    JSON.stringify(
      {
        count: newInv.routes.size,
        builtPathsCount: newInv.builtPaths.length,
        routes: [...newInv.routes.entries()].sort((a, b) => a[0].localeCompare(b[0])),
      },
      null,
      2,
    ),
  );

  // Dedupe probe list
  const toProbe = [...linked]
    .map((u) => {
      const p = normalizePath(u);
      return p ? ORIGIN + p : null;
    })
    .filter(Boolean);
  const unique = [...new Set(toProbe)].sort();

  console.log(`Probing ${unique.length} URLs...`);
  const rows = [];
  let i = 0;
  for (const url of unique) {
    i++;
    if (i % 25 === 0) console.log(`  ${i}/${unique.length}`);
    const oldPath = normalizePath(url);
    const probed = await probe(url);
    const mRow = manifestByPath[oldPath];
    const cls = classify(oldPath, probed, newInv, mRow);
    const discovery = [];
    if (sitemapUrls.has(url) || [...sitemapUrls].some((s) => normalizePath(s) === oldPath))
      discovery.push("sitemap");
    if (mRow) discovery.push("repo-manifest");
    discovery.push("crawl-or-seed");

    rows.push({
      old_url: url,
      old_status: probed.old_status,
      final_old_url: probed.final_old_url,
      title: probed.title,
      canonical: probed.canonical,
      indexability: probed.indexability,
      discovery_source: discovery.join("|"),
      new_url: cls.new_url,
      classification: cls.classification,
      recommended_action: cls.recommended_action,
      priority: cls.priority,
      confidence: cls.confidence,
      notes: [cls.notes, probed.error ? `crawl_error=${probed.error}` : "", mRow ? `manifest=${mRow.outcome}` : ""]
        .filter(Boolean)
        .join(" | "),
    });
  }

  // Ensure every new route appears at least as context in summary (not every row)
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
  const csv = [
    columns.join(","),
    ...rows.map((r) => columns.map((c) => csvEscape(r[c])).join(",")),
  ].join("\n");
  fs.writeFileSync(path.join(outDir, "url-audit.csv"), csv);

  const counts = {};
  for (const r of rows) counts[r.classification] = (counts[r.classification] || 0) + 1;

  const missing = rows.filter((r) => r.classification === "MISSING PAGE");
  const redirects = rows.filter((r) => r.classification === "REDIRECT NEEDED");
  const preserved = rows.filter((r) => r.classification === "PRESERVED");
  const unresolved = rows.filter((r) => r.classification === "UNRESOLVED");
  const p1Missing = missing.filter((r) => r.priority === "P1");

  const summary = `# URL migration audit summary

Generated: ${new Date().toISOString()}  
Live site verified: **Grow Green Weed Control** at canonical host **\`https://growgreenweedcontrol.com\`** (apex HTTPS).  
Observations: \`www\` and \`http\` both **301 → https://growgreenweedcontrol.com/** (WordPress/\`X-Redirect-By\`; server \`LiteSpeed\` / KnownHost stack).  

**This audit does not claim complete URL discovery.** Unlinked URLs may still exist in Search Console, analytics, ads, or server logs.

## Crawl scope

| Source | Result |
| --- | --- |
| robots.txt | Disallows \`/wp-admin/\` (allows \`admin-ajax.php\`); sitemaps: \`/sitemap.xml\`, \`/sitemap.rss\` |
| Sitemap index | Nested: post, page, category, post_tag |
| Sitemap URL count (loc) | ${sitemapUrls.size} |
| Seed link expansion | Homepage, /services/, /lawn-care-blog/, /about-us/, /contact-us/, /request-a-quote/ |
| Repo manifest | \`docs/url-migration-manifest.md\` (${manifest.length} rows) |
| Unique URLs probed | **${rows.length}** |
| Rate limit | ~${DELAY_MS} ms between requests; UA \`${UA}\` |
| Avoided | wp-admin/login, form POSTs, endless query/calendar variants |

### Host checks (observation)

\`\`\`json
${JSON.stringify(hostChecks, null, 2)}
\`\`\`

## New site inventory (local)

| Item | Count / note |
| --- | --- |
| Implemented public path map | **${newInv.routes.size}** paths from pages + generated data |
| \`dist/client\` index.html paths | ${newInv.builtPaths.length || "n/a (rebuild if needed)"} |
| Trailing slash | New site prefers trailing slashes (\`trailingSlash: ignore\` allows OAuth callback without slash) |
| Canonical host config | \`PUBLIC_SITE_URL\` / Astro \`site\` default \`https://growgreenweedcontrol.com\` |
| Indexing | Private preview \`noindex\` until \`PUBLIC_SITE_INDEXING=true\` (launch checklist) |
| CRM lead intake | Browser → \`/api/leads/website\` (not WP \`/wp-json/ggwc/...\`) — preserve attribution query params on redirects |

Campaign landings present in data: facebook-50, facebook-estimate, postcard, trucklead, gym-member, nextdoor.  
Service-area cities: 40 under \`/service-areas/{slug}/\`. Legacy geo WP paths retained via \`geo-pages.generated\` where mapped.

## Counts by classification

| Classification | Count |
| --- | ---: |
${Object.entries(counts)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `| ${k} | ${v} |`)
  .join("\n")} |
| **Total probed** | **${rows.length}** |

## Highest-priority MISSING PAGE candidates

${
  p1Missing.length
    ? p1Missing
        .slice(0, 40)
        .map((r) => `- \`${normalizePath(r.old_url)}\` — ${r.title || "(no title)"} — ${r.recommended_action} _(confidence: ${r.confidence})_`)
        .join("\n")
    : "_None classified P1 missing after automated match (see REDIRECT NEEDED / UNRESOLVED)._"
}

### All MISSING PAGE (${missing.length})

${missing
  .slice(0, 80)
  .map((r) => `- \`${normalizePath(r.old_url)}\` → ${r.recommended_action}`)
  .join("\n") || "_None_"}

## Proposed redirects (REDIRECT NEEDED)

Prefer single-hop **301** to equivalent content. Do **not** blanket-redirect to homepage. Preserve \`utm_*\`, \`gclid\`, \`fbclid\`, and CRM lead source query params when implementing.

${redirects
  .map((r) => `- \`${normalizePath(r.old_url)}\` → \`${r.new_url || "?"}\` — ${r.recommended_action} (${r.confidence})`)
  .join("\n") || "_None_"}

## PRESERVED (same path on new site)

Count: **${preserved.length}**. These should keep path parity at cutover. Spot-check content and forms, especially quote/campaign pages.

## INTENTIONAL REMOVAL / TECHNICAL

Taxonomy archives (\`/category/*\`, \`/tag/*\`), feeds, and WP admin/json routes should not be rebuilt. Prefer **410** for retired taxonomies after owner confirmation, or leave as 404 if logs show no meaningful hits. CRM bridge moves to website-owned API — do not keep public WP JSON lead route.

## UNRESOLVED

${unresolved
  .slice(0, 40)
  .map((r) => `- \`${normalizePath(r.old_url)}\` (${r.old_status}) ${r.title}`)
  .join("\n") || "_None_"}

## Launch blockers / owner decisions

1. Confirm fate of any **MISSING** campaign landings still receiving ad traffic (Facebook / postcard / truck / gym / Nextdoor).
2. Confirm **geo URL strategy**: keep legacy WP geo paths (via \`geo-pages\`) vs 301 to \`/service-areas/{city}/\` only — avoid duplicate thin variants long-term.
3. Confirm taxonomy **410 vs 404** for \`/category/*\` and \`/tag/*\`.
4. Implement redirects on **KnownHost** using the actual stack (LiteSpeed observed). Inspect the live vhost/\`.htaccess\`/LiteSpeed rewrite UI before choosing Apache vs LSWS vs app-level redirects — **do not assume plan capabilities**.
5. Keep \`PUBLIC_SITE_INDEXING\` off until redirects + parity checks pass.
6. Regression checklist (later implementation): preserved URLs 200; redirect single-hop; query param passthrough; quote forms + lead source; no chains/loops.

## Limits & failures

- Crawl is public-link + sitemap + repo manifest based; **orphans require GSC/analytics/log export**.
- HTML title/canonical parsed with regex (good enough for audit, not a browser).
- Rate-limited; transient errors recorded in CSV \`notes\` / \`indexability=crawl-failed\`.
- New-site paths inferred from source data; production deploy headers/CDN not measured.

## MCP / Academy documentation

No CRM-facing workflow changes in this audit-only pass — **no MCP/Academy updates required** unless redirect implementation later changes lead landing URLs or attribution contracts.

## Artifacts

- \`docs/migration/url-audit.csv\`
- \`docs/migration/url-audit-summary.md\` (this file)
- Working copies under \`.migration-work/\` (local only)
`;

  fs.writeFileSync(path.join(outDir, "url-audit-summary.md"), summary);
  fs.writeFileSync(path.join(work, "probe-rows.json"), JSON.stringify(rows, null, 2));
  console.log("Wrote", path.join(outDir, "url-audit.csv"));
  console.log("Wrote", path.join(outDir, "url-audit-summary.md"));
  console.log("Counts", counts);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
