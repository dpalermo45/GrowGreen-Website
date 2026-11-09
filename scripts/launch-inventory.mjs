/**
 * Pre-launch public route inventory for Grow Green website.
 *
 * Run:
 *   node --experimental-strip-types scripts/launch-inventory.mjs
 *
 * Writes docs/launch/route-inventory.json and prints counts + discrepancies.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadData(rel) {
  return import(pathToFileURL(path.join(root, rel)).href);
}

const { services, relatedServicePages, allServicePageSlugs } = await loadData(
  "src/data/services.ts",
);
const { serviceAreas, serviceAreaHubs, serviceAreaCount } = await loadData(
  "src/data/service-areas.ts",
);
const { geoPages, geoPageBySlug } = await loadData("src/data/geo-pages.generated.ts");
const { blogPosts, blogPostBySlug } = await loadData("src/data/blog-posts.generated.ts");
const { campaigns, campaignBySlug } = await loadData("src/data/campaigns.ts");
const { primaryNav, footerNav, ctaNav } = await loadData("src/data/navigation.ts");

const LEGAL_SLUGS = new Set(["privacy-policy", "terms-and-conditions"]);
const UTILITY_SLUGS = new Set([
  "thank-you",
  "thank-you-nextdoor",
  "thank-you-core-aeration",
  "liquid-aeration-quote-request-received",
  "test",
]);

const CORE_STATIC_PATHS = [
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
];

/** @type {Map<string, { path: string, type: string, sources: Set<string> }>} */
const routes = new Map();

function normalizeHtmlPath(p) {
  if (!p || !p.startsWith("/")) return p;
  if (p === "/") return "/";
  return p.endsWith("/") ? p : `${p}/`;
}

function addRoute(rawPath, type, source) {
  const isApi =
    rawPath.startsWith("/api/") ||
    rawPath === "/robots.txt" ||
    rawPath === "/sitemap.xml";
  const pathKey =
    type === "redirect"
      ? rawPath
      : isApi
        ? rawPath.replace(/\/$/, "")
        : normalizeHtmlPath(rawPath);
  if (!pathKey) return;
  let row = routes.get(pathKey);
  if (!row) {
    row = { path: pathKey, type, sources: new Set() };
    routes.set(pathKey, row);
  } else if (row.type !== type && row.type !== "redirect") {
    row.type = preferType(row.type, type);
  }
  row.sources.add(source);
}

function preferType(a, b) {
  const rank = {
    redirect: 0,
    error: 1,
    api: 2,
    utility: 3,
    legal: 4,
    static: 5,
    blog: 6,
    campaign: 7,
    geo: 8,
    "service-area": 9,
    service: 10,
  };
  return (rank[a] ?? 99) <= (rank[b] ?? 99) ? a : b;
}

function classifyDynamicSlug(slug) {
  if (LEGAL_SLUGS.has(slug)) return "legal";
  if (UTILITY_SLUGS.has(slug)) return "utility";
  if (serviceBySlugFromServices(slug)) return "service";
  if (slug in relatedServicePages) return "service";
  if (slug in geoPageBySlug) return "geo";
  if (slug in campaignBySlug) return "campaign";
  if (slug in blogPostBySlug) return "blog";
  return "static";
}

function serviceBySlugFromServices(slug) {
  return services.some((s) => s.slug === slug);
}

function listPageFiles(dir, base = "") {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith("_")) continue;
    const full = path.join(dir, ent.name);
    const rel = `${base}/${ent.name}`.replace(/\\/g, "/");
    if (ent.isDirectory()) out.push(...listPageFiles(full, rel));
    else if (/\.(astro|ts|tsx|js|jsx)$/.test(ent.name)) out.push(rel);
  }
  return out;
}

function fileToPublicPath(file) {
  const rel = file.replace(/^\/+/, "");
  if (rel.startsWith("api/")) {
    return `/${rel.replace(/\.(ts|js)$/, "")}`.replace(/\/index$/, "");
  }
  if (rel.endsWith(".ts") && !rel.endsWith(".astro")) {
    const base = rel.replace(/\.ts$/, "");
    if (base === "sitemap.xml") return "/sitemap.xml";
    if (base === "robots.txt") return "/robots.txt";
    return null;
  }
  if (rel === "index.astro") return "/";
  if (rel === "404.astro") return null;
  if (rel === "[slug].astro") return null;
  if (rel === "service-areas/[slug].astro") return null;
  const base = rel.replace(/\.astro$/, "");
  if (base.startsWith("service-areas/")) {
    const leaf = base.split("/").pop();
    if (leaf === "index") return "/service-areas/";
    return null;
  }
  return normalizeHtmlPath(`/${base}`);
}

function collectNavHrefs() {
  const hrefs = new Set();
  const walk = (links) => {
    for (const l of links) {
      if (l.href?.startsWith("/")) hrefs.add(normalizeHtmlPath(l.href));
      if (l.children) walk(l.children);
    }
  };
  walk(primaryNav);
  for (const g of footerNav) walk(g.links);
  for (const v of Object.values(ctaNav)) {
    if (v.href?.startsWith("/")) hrefs.add(normalizeHtmlPath(v.href));
  }
  hrefs.add("/sitemap.xml");

  const headerPath = path.join(root, "src/components/Header.astro");
  const footerPath = path.join(root, "src/components/Footer.astro");
  const hrefRe = /href=["'](\/[^"'#?]+)["']/g;
  for (const f of [headerPath, footerPath]) {
    const text = fs.readFileSync(f, "utf8");
    let m;
    while ((m = hrefRe.exec(text))) {
      const h = m[1];
      if (h.startsWith("/") && !h.startsWith("//")) {
        hrefs.add(
          h.endsWith(".xml") ? h.replace(/\/$/, "") : normalizeHtmlPath(h),
        );
      }
    }
  }
  return hrefs;
}

function parseMiddlewareRedirects() {
  const text = fs.readFileSync(path.join(root, "src/middleware.ts"), "utf8");
  const block = text.match(/const redirects[^=]*=\s*\{([\s\S]*?)\};/);
  if (!block) return [];
  const entries = [];
  const pairRe = /"([^"]+)":\s*"([^"]+)"/g;
  let m;
  while ((m = pairRe.exec(block[1]))) {
    entries.push({ from: m[1], to: m[2] });
  }
  return entries;
}

function parseAstroConfigRedirects() {
  const text = fs.readFileSync(path.join(root, "astro.config.mjs"), "utf8");
  if (!/redirects\s*:/.test(text)) return [];
  return ["astro.config.mjs defines redirects — inspect manually"];
}

function buildSitemapPaths() {
  const paths = new Set(CORE_STATIC_PATHS.map(normalizeHtmlPath));
  for (const s of services) paths.add(normalizeHtmlPath(`/${s.slug}/`));
  for (const slug of Object.keys(relatedServicePages)) {
    paths.add(normalizeHtmlPath(`/${slug}/`));
  }
  for (const a of serviceAreas) {
    paths.add(normalizeHtmlPath(`/service-areas/${a.slug}/`));
  }
  for (const g of geoPages) {
    paths.add(normalizeHtmlPath(g.path));
  }
  for (const c of campaigns) paths.add(normalizeHtmlPath(`/${c.slug}/`));
  for (const p of blogPosts) paths.add(normalizeHtmlPath(p.path));
  return paths;
}

function getStaticPathsSlugs() {
  const slugs = new Set();
  for (const s of services) {
    slugs.add(s.slug);
    s.relatedPages?.forEach((r) => slugs.add(r.slug));
  }
  for (const slug of Object.keys(relatedServicePages)) slugs.add(slug);
  for (const slug of Object.keys(geoPageBySlug)) slugs.add(slug);
  for (const slug of Object.keys(campaignBySlug)) slugs.add(slug);
  for (const p of blogPosts) slugs.add(p.slug);
  for (const u of UTILITY_SLUGS) slugs.add(u);
  return slugs;
}

// ——— Collect routes ———

const pagesDir = path.join(root, "src/pages");
for (const file of listPageFiles(pagesDir)) {
  const publicPath = fileToPublicPath(file);
  if (publicPath) {
    let type = "static";
    if (publicPath === "/privacy-policy/" || publicPath === "/terms-and-conditions/") {
      type = "legal";
    } else if (
      publicPath === "/robots.txt" ||
      publicPath === "/sitemap.xml" ||
      publicPath === "/google-reviews/setup/"
    ) {
      type = "utility";
    } else if (publicPath === "/customer-login-pay-bill/") {
      type = "utility";
    }
    addRoute(publicPath, type, `src/pages${file}`);
  } else if (file.endsWith("404.astro")) {
    addRoute("/(astro-not-found)/", "error", "src/pages/404.astro");
  } else if (file.endsWith("[slug].astro") && !file.includes("service-areas")) {
    addRoute("/[slug]/", "static", `src/pages${file} (dynamic template)`);
  } else if (file.includes("service-areas/[slug].astro")) {
    addRoute("/service-areas/[slug]/", "service-area", `src/pages${file} (dynamic template)`);
  }
}

for (const file of listPageFiles(pagesDir)) {
  if (!file.startsWith("/api/")) continue;
  const routePath = fileToPublicPath(file.replace(/^\//, ""));
  if (routePath) addRoute(routePath, "api", `src/pages${file}`);
}

for (const slug of getStaticPathsSlugs()) {
  const type = classifyDynamicSlug(slug);
  addRoute(`/${slug}/`, type, "getStaticPaths:[slug].astro");
}

for (const area of serviceAreas) {
  addRoute(
    `/service-areas/${area.slug}/`,
    "service-area",
    "getStaticPaths:service-areas/[slug].astro",
  );
}

for (const hub of serviceAreaHubs) {
  if (hub.existingUrl) {
    addRoute(hub.existingUrl, "geo", "service-areas.ts:serviceAreaHubs");
  }
  hub.relatedUrls?.forEach((u) => addRoute(u, "geo", "service-areas.ts:hub.relatedUrls"));
}

for (const area of serviceAreas) {
  if (area.existingUrl) {
    addRoute(area.existingUrl, "geo", "service-areas.ts:existingUrl");
  }
  area.relatedUrls?.forEach((u) => addRoute(u, "geo", "service-areas.ts:relatedUrls"));
}

for (const g of geoPages) {
  addRoute(g.path, "geo", "geo-pages.generated.ts");
}

for (const p of blogPosts) {
  addRoute(p.path, "blog", "blog-posts.generated.ts");
}

for (const c of campaigns) {
  addRoute(`/${c.slug}/`, "campaign", "campaigns.ts");
}

for (const { from, to } of parseMiddlewareRedirects()) {
  addRoute(from, "redirect", `middleware.ts→${to}`);
}

const astroRedirects = parseAstroConfigRedirects();

// ——— Discrepancies ———

const sitemapPaths = buildSitemapPaths();
const inventoryHtml = new Set(
  [...routes.values()]
    .filter((r) => r.type !== "redirect" && r.type !== "error" && r.type !== "api")
    .map((r) => r.path),
);

const discrepancies = [];

for (const p of sitemapPaths) {
  if (!inventoryHtml.has(p)) {
    discrepancies.push({
      kind: "sitemap-not-in-inventory",
      path: p,
      detail: "Listed in sitemap.xml.ts logic but missing from merged inventory",
    });
  }
}

for (const p of inventoryHtml) {
  if (
    !sitemapPaths.has(p) &&
    p !== "/robots.txt" &&
    p !== "/sitemap.xml" &&
    !UTILITY_SLUGS.has(p.replace(/^\/|\/$/g, "")) &&
    p !== "/google-reviews/setup/" &&
    p !== "/customer-login-pay-bill/" &&
    !p.includes("[slug]")
  ) {
    discrepancies.push({
      kind: "inventory-not-in-sitemap",
      path: p,
      detail: "In inventory but excluded from sitemap.xml.ts (may be intentional)",
    });
  }
}

const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "docs/url-migration-manifest.json"), "utf8"),
);
const manifestRetained = manifest.urls.filter((u) => u.outcome === "retained");
for (const u of manifestRetained) {
  const p = normalizeHtmlPath(u.path);
  if (p.includes("*") || p.includes("{")) continue;
  if (!inventoryHtml.has(p) && !routes.has(p)) {
    discrepancies.push({
      kind: "manifest-retained-missing",
      path: p,
      detail: "docs/url-migration-manifest.json retained URL not in inventory",
    });
  }
}

const manifestRedirected = manifest.urls.filter((u) => u.outcome === "redirected");
const middlewareFrom = new Set(parseMiddlewareRedirects().map((r) => r.from));
for (const u of manifestRedirected) {
  const from = u.path;
  const variants = [from, from.endsWith("/") ? from.slice(0, -1) : `${from}/`];
  if (!variants.some((v) => middlewareFrom.has(v) || routes.has(v))) {
    discrepancies.push({
      kind: "manifest-redirect-not-in-middleware",
      path: from,
      detail: `Manifest redirect→${u.redirect_to || "?"} not found in middleware`,
    });
  }
}

const navHrefs = collectNavHrefs();
for (const href of navHrefs) {
  if (href === "/sitemap.xml") continue;
  if (!inventoryHtml.has(href) && !routes.has(href)) {
    discrepancies.push({
      kind: "nav-link-missing",
      path: href,
      detail: "Header/Footer/navigation.ts link not in inventory",
    });
  }
}

const staticPathsSlugs = getStaticPathsSlugs();
for (const slug of allServicePageSlugs) {
  if (!staticPathsSlugs.has(slug)) {
    discrepancies.push({
      kind: "services-slug-not-in-getStaticPaths",
      path: `/${slug}/`,
      detail: "services.ts allServicePageSlugs missing from getStaticPaths replica",
    });
  }
}

if (serviceAreas.length !== serviceAreaCount) {
  discrepancies.push({
    kind: "service-area-count",
    path: "(n/a)",
    detail: `serviceAreas.length=${serviceAreas.length} vs serviceAreaCount=${serviceAreaCount}`,
  });
}

const auditCsvPath = path.join(root, "docs/migration/url-audit.csv");
if (fs.existsSync(auditCsvPath)) {
  const csv = fs.readFileSync(auditCsvPath, "utf8");
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const redirectNeededRe = /,REDIRECT NEEDED,/;
  for (let i = 1; i < lines.length; i++) {
    if (!redirectNeededRe.test(lines[i])) continue;
    const urlMatch = lines[i].match(/^https?:\/\/[^,]+/);
    if (!urlMatch) continue;
    try {
      const pathname = new URL(urlMatch[0]).pathname;
      if (middlewareFrom.has(pathname)) continue;
      const alt = pathname.endsWith("/") ? pathname.slice(0, -1) : `${pathname}/`;
      if (middlewareFrom.has(alt)) continue;
      discrepancies.push({
        kind: "url-audit-redirect-gap",
        path: pathname,
        detail: "url-audit.csv REDIRECT NEEDED not in middleware.ts (pending implementation)",
      });
    } catch {
      /* skip malformed */
    }
  }
}

if (astroRedirects.length) {
  discrepancies.push({
    kind: "astro-config-redirects",
    path: "(n/a)",
    detail: astroRedirects[0],
  });
}

const slugSet = getStaticPathsSlugs();
if (slugSet.size !== [...slugSet].filter(Boolean).length) {
  discrepancies.push({ kind: "duplicate-slugs", path: "(n/a)", detail: "Duplicate slugs in getStaticPaths" });
}

// geo vs slug alignment
for (const g of geoPages) {
  const slugPath = normalizeHtmlPath(`/${g.slug}/`);
  if (normalizeHtmlPath(g.path) !== slugPath && !routes.has(normalizeHtmlPath(g.path))) {
    discrepancies.push({
      kind: "geo-path-slug-mismatch",
      path: g.path,
      detail: `slug=${g.slug} path differs from /${g.slug}/`,
    });
  }
}

// ——— Output ———

const inventory = [...routes.values()]
  .map((r) => ({
    path: r.path,
    type: r.type,
    source: [...r.sources].sort().join("; "),
  }))
  .sort((a, b) => a.path.localeCompare(b.path));

const counts = {};
for (const row of inventory) {
  counts[row.type] = (counts[row.type] || 0) + 1;
}

const outDir = path.join(root, "docs/launch");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "route-inventory.json");
const payload = {
  generatedAt: new Date().toISOString(),
  totals: {
    routes: inventory.length,
    byType: counts,
    serviceAreaCities: serviceAreas.length,
    serviceAreaHubs: serviceAreaHubs.length,
    getStaticPathsSlugs: slugSet.size,
    sitemapUrls: sitemapPaths.size,
    manifestRetained: manifestRetained.length,
    manifestRedirected: manifestRedirected.length,
    navInternalLinks: navHrefs.size,
    middlewareRedirects: parseMiddlewareRedirects().length,
  },
  discrepancies,
  routes: inventory,
};

fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);

console.log("Grow Green — launch route inventory");
console.log("Written:", path.relative(root, outPath));
console.log("");
console.log("Counts by type:");
for (const [type, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${type.padEnd(14)} ${n}`);
}
console.log(`  ${"TOTAL".padEnd(14)} ${inventory.length}`);
console.log("");
console.log("Source totals:");
console.log(`  Service area cities: ${serviceAreas.length} (expected ${serviceAreaCount})`);
console.log(`  getStaticPaths slugs:  ${slugSet.size}`);
console.log(`  Sitemap URLs:          ${sitemapPaths.size}`);
console.log(`  Manifest retained:     ${manifestRetained.length}`);
console.log(`  Manifest redirected:   ${manifestRedirected.length}`);
console.log(`  Middleware redirects:  ${parseMiddlewareRedirects().length}`);
console.log("");
if (discrepancies.length) {
  console.log(`Discrepancies (${discrepancies.length}):`);
  const byKind = {};
  for (const d of discrepancies) {
    byKind[d.kind] = (byKind[d.kind] || 0) + 1;
  }
  for (const [kind, n] of Object.entries(byKind).sort()) {
    console.log(`  ${kind}: ${n}`);
  }
  console.log("");
  for (const d of discrepancies.slice(0, 40)) {
    console.log(`  - [${d.kind}] ${d.path} — ${d.detail}`);
  }
  if (discrepancies.length > 40) {
    console.log(`  ... and ${discrepancies.length - 40} more (see JSON)`);
  }
} else {
  console.log("No discrepancies detected.");
}
