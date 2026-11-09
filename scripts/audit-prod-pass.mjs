/**
 * Production audit pass — SEO, APIs, redirects, sitemap vs inventory, content smells.
 * Writes docs/audit-prod-2026-11-09/*
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "docs/audit-prod-2026-11-09");
fs.mkdirSync(outDir, { recursive: true });

const BASE = process.env.BASE_URL || "https://growgreenweedcontrol.com";

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    return row;
  });
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else q = !q;
      continue;
    }
    if (c === "," && !q) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out;
}

function extract(html, re) {
  const m = html.match(re);
  return m ? m[1] : "";
}

async function fetchText(url, opts = {}) {
  const res = await fetch(url, {
    redirect: opts.redirect || "manual",
    method: opts.method || "GET",
    headers: opts.headers || {},
    body: opts.body,
  });
  const text =
    opts.method === "HEAD" || opts.skipBody
      ? ""
      : await res.text().catch(() => "");
  return {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    location: res.headers.get("location") || "",
    text,
  };
}

const pageAudit = parseCsv(
  fs.readFileSync(path.join(root, "docs/launch/page-audit.csv"), "utf8"),
);
const inventory = JSON.parse(
  fs.readFileSync(path.join(root, "docs/launch/route-inventory.json"), "utf8"),
);

const findings = [];
function find(sev, id, title, evidence, routes = [], fix = "") {
  findings.push({ severity: sev, id, title, evidence, routes, fix });
}

// --- Analyze crawl CSV ---
const status404 = pageAudit.filter((r) => r.status === "404");
const noH1 = pageAudit.filter(
  (r) => r.status === "200" && r.hasH1 !== "yes" && r.pageType !== "redirect",
);
const mojibake = pageAudit.filter(
  (r) =>
    /â€|Ã.|Â.|&amp;amp;/.test(r.title || "") ||
    /â€|Ã.|Â./.test(r.canonical || ""),
);
const campaignsIndexed = pageAudit.filter(
  (r) =>
    r.pageType === "campaign" &&
    r.status === "200" &&
    /index,\s*follow/i.test(r.robotsMeta || ""),
);
const thankYouIndexed = pageAudit.filter(
  (r) =>
    /thank-you/i.test(r.path) &&
    r.status === "200" &&
    /index,\s*follow/i.test(r.robotsMeta || ""),
);
const testIndexed = pageAudit.filter(
  (r) =>
    r.path === "/test/" &&
    r.status === "200" &&
    /index,\s*follow/i.test(r.robotsMeta || ""),
);

if (status404.length) {
  find(
    "medium",
    "crawl-404",
    "Inventory routes returning 404 on production",
    status404.map((r) => `${r.path} → ${r.status}`).join("; "),
    status404.map((r) => r.path),
    "Confirm intentional (protected/retired) vs missing pages",
  );
}
if (noH1.length) {
  find(
    "medium",
    "missing-h1",
    "HTML 200 pages without H1",
    noH1.map((r) => r.path).join(", "),
    noH1.map((r) => r.path),
  );
}
if (mojibake.length) {
  find(
    "high",
    "title-encoding",
    "Mojibake or double-escaped entities in titles",
    mojibake.map((r) => `${r.path}: ${r.title}`).slice(0, 20).join(" | "),
    mojibake.map((r) => r.path),
    "Fix source content encoding / HTML entity escaping in layout",
  );
}
if (campaignsIndexed.length) {
  find(
    "medium",
    "campaign-indexable",
    "Campaign landings are index,follow and appear crawlable",
    campaignsIndexed.map((r) => r.path).join(", "),
    campaignsIndexed.map((r) => r.path),
    "Confirm intent; usually campaign/noindex or keep indexable if SEO-valuable",
  );
}
if (thankYouIndexed.length || testIndexed.length) {
  find(
    "high",
    "utility-indexable",
    "Thank-you / test utility pages are indexable on production",
    [...thankYouIndexed, ...testIndexed]
      .map((r) => `${r.path} robots=${r.robotsMeta}`)
      .join("; "),
    [...thankYouIndexed, ...testIndexed].map((r) => r.path),
    "Force noindex on thank-you and /test/",
  );
}

// --- Sitemap ---
const sm = await fetchText(`${BASE}/sitemap.xml`);
const smUrls = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const smPaths = smUrls.map((u) => new URL(u).pathname);

const inventoryHtml = inventory.routes
  .filter((r) => !["api", "redirect", "error"].includes(r.type))
  .map((r) => r.path);

const inSmNotInv = smPaths.filter(
  (p) => !inventoryHtml.includes(p) && !inventoryHtml.includes(p.replace(/\/$/, "") + "/"),
);
const inInvNotSm = inventoryHtml.filter(
  (p) =>
    !["/thank-you/", "/thank-you-nextdoor/", "/thank-you-core-aeration/", "/liquid-aeration-quote-request-received/", "/test/", "/google-reviews/setup/"].includes(p) &&
    !smPaths.includes(p),
);

find(
  "info",
  "sitemap-count",
  `Production sitemap has ${smPaths.length} URLs`,
  smPaths.slice(0, 5).join(", ") + "...",
  [],
);
if (inInvNotSm.length) {
  find(
    "medium",
    "inventory-missing-from-sitemap",
    "Public inventory paths missing from production sitemap",
    inInvNotSm.join(", "),
    inInvNotSm,
  );
}

// --- Live page SEO sample + campaigns ---
const seoTargets = [
  "/",
  "/request-a-quote/",
  "/post-card-estimate-request/",
  "/nextdoor-estimate-request/",
  "/trucklead/",
  "/facebook-estimate-request/",
  "/request-an-estimate-facebook-50/",
  "/gym-member-lawn-care-special/",
  "/thank-you/",
  "/thank-you-nextdoor/",
  "/test/",
  "/careers/",
  "/customer-login-pay-bill/",
  "/lawn-care-blog/",
  "/fire-ant-treatments-baton-rouge/",
  "/how-to-kill-pickers-stickers-burweed-in-louisiana/",
];

const seoRows = [];
for (const p of seoTargets) {
  const res = await fetchText(`${BASE}${p}`);
  const html = res.text;
  const title = extract(html, /<title>([^<]*)<\/title>/i);
  const robots = extract(html, /name=["']robots["']\s+content=["']([^"']*)/i);
  const canon = extract(html, /rel=["']canonical["']\s+href=["']([^"']*)/i) ||
    extract(html, /href=["']([^"']*)["']\s+rel=["']canonical["']/i);
  const desc = extract(html, /name=["']description["']\s+content=["']([^"']*)/i);
  const localhost =
    /localhost|127\.0\.0\.1|onrender\.com|staging/i.test(html.slice(0, 50000));
  seoRows.push({
    path: p,
    status: res.status,
    title,
    robots,
    canonical: canon,
    description: desc.slice(0, 160),
    localhostOrStagingRef: localhost,
    mojibake: /â€|Ã.|Â.|&amp;amp;/.test(title + desc),
  });
}
fs.writeFileSync(
  path.join(outDir, "seo-spotcheck.json"),
  JSON.stringify(seoRows, null, 2),
);

for (const row of seoRows) {
  if (row.localhostOrStagingRef) {
    find(
      "critical",
      "staging-refs",
      "Page HTML references localhost/staging host",
      row.path,
      [row.path],
    );
  }
  if (row.mojibake) {
    find(
      "high",
      `mojibake-${row.path}`,
      "Mojibake on live page meta/title",
      `${row.path}: ${row.title}`,
      [row.path],
    );
  }
}

// --- APIs ---
const apiResults = [];
const leadGet = await fetchText(`${BASE}/api/leads/website/`);
apiResults.push({ method: "GET", path: "/api/leads/website/", status: leadGet.status, body: leadGet.text.slice(0, 200) });

const leadPostEmpty = await fetchText(`${BASE}/api/leads/website/`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: "{}",
});
apiResults.push({
  method: "POST",
  path: "/api/leads/website/",
  status: leadPostEmpty.status,
  body: leadPostEmpty.text.slice(0, 300),
});

const openings = await fetchText(`${BASE}/api/careers/openings/`);
apiResults.push({
  method: "GET",
  path: "/api/careers/openings/",
  status: openings.status,
  body: openings.text.slice(0, 300),
});

const reviews = await fetchText(`${BASE}/api/google-reviews/display/`);
apiResults.push({
  method: "GET",
  path: "/api/google-reviews/display/",
  status: reviews.status,
  body: reviews.text.slice(0, 300),
});

const setup = await fetchText(`${BASE}/google-reviews/setup/`);
apiResults.push({
  method: "GET",
  path: "/google-reviews/setup/",
  status: setup.status,
  body: setup.text.slice(0, 200),
});

const oauthStart = await fetchText(`${BASE}/api/google-reviews/oauth/start/`);
apiResults.push({
  method: "GET",
  path: "/api/google-reviews/oauth/start/",
  status: oauthStart.status,
  body: oauthStart.text.slice(0, 200),
});

fs.writeFileSync(path.join(outDir, "api-probes.json"), JSON.stringify(apiResults, null, 2));

if (leadPostEmpty.status === 404) {
  find(
    "critical",
    "lead-api-missing",
    "POST /api/leads/website/ returns 404 on production",
    leadPostEmpty.text.slice(0, 200),
    ["/api/leads/website/"],
    "Deploy/fix Node SSR routes for lead intake",
  );
} else if (leadPostEmpty.status >= 500) {
  find(
    "critical",
    "lead-api-5xx",
    "Lead intake endpoint returning server error",
    `${leadPostEmpty.status} ${leadPostEmpty.text.slice(0, 200)}`,
    ["/api/leads/website/"],
  );
} else if (leadPostEmpty.status < 400 && /ok"\s*:\s*true/.test(leadPostEmpty.text) && !/"mocked"\s*:\s*true/.test(leadPostEmpty.text)) {
  find(
    "critical",
    "lead-false-success",
    "Empty lead POST returned success without valid payload",
    leadPostEmpty.text.slice(0, 300),
    ["/api/leads/website/"],
  );
}

try {
  const rev = JSON.parse(reviews.text);
  if (!rev.available) {
    find(
      "high",
      "reviews-unavailable",
      "Google reviews display API reports unavailable",
      reviews.text.slice(0, 200),
      ["/api/google-reviews/display/"],
    );
  }
} catch {
  find("high", "reviews-bad-json", "Reviews display API non-JSON", reviews.text.slice(0, 200));
}

if (setup.status === 200 && !/403|401|not (allowed|authorized)|loopback/i.test(setup.text)) {
  find(
    "critical",
    "reviews-setup-public",
    "Google reviews setup appears publicly accessible",
    `status=${setup.status}`,
    ["/google-reviews/setup/"],
  );
}

if (oauthStart.status === 200 && /accounts\.google|client_id/i.test(oauthStart.text + (oauthStart.location || ""))) {
  find(
    "critical",
    "oauth-start-public",
    "OAuth start reachable publicly",
    `status=${oauthStart.status} loc=${oauthStart.location}`,
    ["/api/google-reviews/oauth/start/"],
  );
}

// --- Portal link ---
const portalPage = await fetchText(`${BASE}/customer-login-pay-bill/`);
const portalHref =
  extract(portalPage.text, /href=["'](https?:\/\/[^"']*portal[^"']*)["']/i) ||
  extract(portalPage.text, /href=["'](https?:\/\/[^"']*customer[^"']*)["']/i) ||
  [...portalPage.text.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)]
    .map((m) => m[1])
    .find((h) => /render\.com|portal|pay|login/i.test(h)) ||
  "";

const portalLinks = [...portalPage.text.matchAll(/href=["']([^"']+)["']/gi)].map((m) => m[1]);
fs.writeFileSync(
  path.join(outDir, "portal-links.json"),
  JSON.stringify({ portalHref, sampleLinks: portalLinks.filter((h) => !h.startsWith("#")).slice(0, 40) }, null, 2),
);

// --- Legacy / GSC review URLs ---
const legacy = [
  "/category/weed/",
  "/feed/",
  "/estimate-request/",
  "/reviews/",
  "/fire-ant-control/",
  "/lawn-care-baton-rouge/",
  "/lawn-care-prairieville/",
  "/lawn-treatment-prairieville/",
  "/lawn-treatments-springfield-la/",
  "/wp-json/ggwc/v1/website-lead",
];
const legacyRows = [];
for (const p of legacy) {
  const res = await fetchText(`${BASE}${p}`);
  legacyRows.push({ path: p, status: res.status, location: res.location });
}
fs.writeFileSync(path.join(outDir, "legacy-probes.json"), JSON.stringify(legacyRows, null, 2));

// --- Offer copy spotcheck ---
const offerPages = [
  "/post-card-estimate-request/",
  "/nextdoor-estimate-request/",
  "/trucklead/",
  "/facebook-estimate-request/",
  "/request-an-estimate-facebook-50/",
];
const offerRows = [];
for (const p of offerPages) {
  const res = await fetchText(`${BASE}${p}`);
  const text = res.text.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  offerRows.push({
    path: p,
    has25: /\$25/.test(text),
    has50pct: /50%\s*off|50 percent/i.test(text),
    has75: /\$75/.test(text),
    has39: /\$39/.test(text),
    snippet: text.slice(0, 400),
  });
}
fs.writeFileSync(path.join(outDir, "offer-copy.json"), JSON.stringify(offerRows, null, 2));

// --- Analytics inventory from homepage ---
const home = await fetchText(`${BASE}/`);
const analytics = {
  gtm: [...home.text.matchAll(/GTM-[A-Z0-9]+/g)].map((m) => m[0]),
  ga4: [...home.text.matchAll(/G-[A-Z0-9]+/g)].map((m) => m[0]),
  metaPixel: [...home.text.matchAll(/fbq\(|facebook\.net\/en_US\/fbevents\.js|meta pixel/gi)].length > 0,
  scripts: [...home.text.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]),
};
fs.writeFileSync(path.join(outDir, "analytics-inventory.json"), JSON.stringify(analytics, null, 2));

// Copy crawl artifacts into audit folder
for (const f of ["page-audit.csv", "link-audit.csv", "crawl-summary.json", "route-inventory.json"]) {
  const src = path.join(root, "docs/launch", f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(outDir, f));
}

fs.writeFileSync(
  path.join(outDir, "findings-partial.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), base: BASE, findings }, null, 2),
);

console.log(`Findings so far: ${findings.length}`);
for (const f of findings) {
  console.log(`[${f.severity}] ${f.id}: ${f.title}`);
}
console.log(`Wrote ${outDir}`);
