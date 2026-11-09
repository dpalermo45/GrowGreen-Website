/**
 * Production-preview HTML crawl against BASE_URL (default http://127.0.0.1:4321).
 *
 *   BASE_URL=http://127.0.0.1:4321 npm run launch:crawl
 *
 * Reads docs/launch/route-inventory.json (regenerates if missing).
 * Writes docs/launch/page-audit.csv, link-audit.csv, crawl-summary.json
 */
import fs from "node:fs";
import path from "node:path";
import {
  checkUrlStatus,
  crawlPathsFromInventory,
  ensureLaunchDir,
  extractAnchors,
  extractCanonical,
  extractImages,
  extractJsonLdBlocks,
  extractMetaContent,
  extractTitle,
  fetchWithOneRedirect,
  hasH1,
  isSameOrigin,
  loadRouteInventory,
  normalizePathname,
  parseBaseUrl,
  probeServer,
  resolveHref,
  urlsFromJsonLd,
  writeCsv,
} from "./launch-audit-lib.mjs";

const base = parseBaseUrl();
const baseOrigin = base.origin;

const regenerate = process.env.REGENERATE_INVENTORY === "1";
let inventory;
try {
  inventory = loadRouteInventory({ regenerate });
} catch (err) {
  console.error(String(err));
  process.exit(1);
}

const targets = crawlPathsFromInventory(inventory);
const outDir = ensureLaunchDir();

const probe = await probeServer(base);
const connectionError = probe.ok ? "" : probe.error || `HTTP ${probe.status}`;

const pageRows = [];
const linkRows = [];
const urlStatusCache = new Map();

async function statusFor(url) {
  const key = String(url);
  if (urlStatusCache.has(key)) return urlStatusCache.get(key);
  const st = await checkUrlStatus(url);
  urlStatusCache.set(key, st);
  return st;
}

function isInternalHtmlPath(pathname) {
  if (!pathname || !pathname.startsWith("/")) return false;
  if (pathname.startsWith("/api/")) return false;
  return true;
}

for (const { path: routePath, pageType } of targets) {
  const pageUrl = new URL(routePath, base);
  let status = 0;
  let finalUrl = String(pageUrl);
  let html = "";
  let fetchError = "";

  if (!probe.ok) {
    fetchError = connectionError;
  } else {
    try {
      const result = await fetchWithOneRedirect(pageUrl);
      status = result.status;
      finalUrl = result.finalUrl;
      if (result.response.ok) {
        html = await result.response.text();
      }
    } catch (err) {
      fetchError = err instanceof Error ? err.message : String(err);
    }
  }

  const title = html ? extractTitle(html) : "";
  const h1Present = html ? hasH1(html) : false;
  const robotsMeta = html ? extractMetaContent(html, "robots") : "";
  const canonical = html ? extractCanonical(html) : "";
  const ogImage = html ? extractMetaContent(html, "og:image", { prop: true }) : "";

  const brokenLinks = [];
  const checked = new Set();

  if (html) {
    const finalBase = new URL(finalUrl);
    const anchorHrefs = extractAnchors(html);
    for (const href of anchorHrefs) {
      const resolved = resolveHref(finalBase, href);
      if (!resolved || !isSameOrigin(baseOrigin, resolved)) continue;
      const pathname = normalizePathname(resolved.pathname + resolved.search);
      if (!pathname || !isInternalHtmlPath(pathname)) continue;
      const key = `${pathname}`;
      if (checked.has(key)) continue;
      checked.add(key);
      const st = await statusFor(resolved);
      if (st === 404 || st === 0) {
        brokenLinks.push(pathname);
        linkRows.push({
          sourcePath: routePath,
          resourceUrl: pathname,
          resourceKind: "internal-link",
          httpStatus: st,
          fromPage: routePath,
        });
      }
    }

    for (const src of extractImages(html)) {
      const resolved = resolveHref(finalBase, src);
      if (!resolved || !isSameOrigin(baseOrigin, resolved)) continue;
      const key = String(resolved);
      if (checked.has(key)) continue;
      checked.add(key);
      const st = await statusFor(resolved);
      if (st === 404 || st === 0) {
        linkRows.push({
          sourcePath: routePath,
          resourceUrl: resolved.pathname,
          resourceKind: "img",
          httpStatus: st,
          fromPage: routePath,
        });
      }
    }

    for (const block of extractJsonLdBlocks(html)) {
      for (const rawUrl of urlsFromJsonLd(block)) {
        const resolved = resolveHref(finalBase, rawUrl);
        if (!resolved || !isSameOrigin(baseOrigin, resolved)) continue;
        const pathname = normalizePathname(resolved.pathname);
        if (!pathname) continue;
        const key = `ld:${pathname}`;
        if (checked.has(key)) continue;
        checked.add(key);
        const st = await statusFor(resolved);
        if (st === 404 || st === 0) {
          linkRows.push({
            sourcePath: routePath,
            resourceUrl: pathname,
            resourceKind: "json-ld-url",
            httpStatus: st,
            fromPage: routePath,
          });
        }
      }
    }

    const canResolved = canonical ? resolveHref(finalBase, canonical) : null;
    if (canResolved && isSameOrigin(baseOrigin, canResolved)) {
      const st = await statusFor(canResolved);
      if (st === 404 || st === 0) {
        linkRows.push({
          sourcePath: routePath,
          resourceUrl: canonical,
          resourceKind: "canonical",
          httpStatus: st,
          fromPage: routePath,
        });
      }
    }
  }

  pageRows.push({
    path: routePath,
    status: fetchError ? "error" : status,
    finalUrl,
    title,
    hasH1: h1Present ? "yes" : "no",
    robotsMeta,
    canonical,
    ogImage,
    brokenInternalLinkCount: brokenLinks.length,
    pageType,
  });
}

const pageHeaders = [
  "path",
  "status",
  "finalUrl",
  "title",
  "hasH1",
  "robotsMeta",
  "canonical",
  "ogImage",
  "brokenInternalLinkCount",
  "pageType",
];

const linkHeaders = [
  "sourcePath",
  "resourceUrl",
  "resourceKind",
  "httpStatus",
  "fromPage",
];

writeCsv(path.join(outDir, "page-audit.csv"), pageHeaders, pageRows);
writeCsv(path.join(outDir, "link-audit.csv"), linkHeaders, linkRows);

const statusHistogram = {};
for (const row of pageRows) {
  const k = String(row.status);
  statusHistogram[k] = (statusHistogram[k] || 0) + 1;
}

const summary = {
  generatedAt: new Date().toISOString(),
  baseUrl: String(base),
  connectionOk: probe.ok,
  connectionError: probe.ok ? null : connectionError,
  inventoryGeneratedAt: inventory.generatedAt,
  pagesCrawled: pageRows.length,
  statusHistogram,
  pagesWithH1: pageRows.filter((r) => r.hasH1 === "yes").length,
  pagesWithBrokenInternalLinks: pageRows.filter((r) => r.brokenInternalLinkCount > 0).length,
  brokenLinkRows: linkRows.length,
  brokenByKind: linkRows.reduce((acc, r) => {
    acc[r.resourceKind] = (acc[r.resourceKind] || 0) + 1;
    return acc;
  }, {}),
};

fs.writeFileSync(
  path.join(outDir, "crawl-summary.json"),
  `${JSON.stringify(summary, null, 2)}\n`,
);

console.log("Grow Green — launch crawl");
console.log(`BASE_URL: ${base}`);
console.log(`Pages: ${pageRows.length}`);
console.log(`Broken link/img rows: ${linkRows.length}`);
if (!probe.ok) {
  console.warn("");
  console.warn("WARNING: Could not connect to preview server.");
  console.warn(connectionError);
  console.warn("Start preview (npm run preview) and re-run launch:crawl.");
}
console.log("Written:");
console.log("  docs/launch/page-audit.csv");
console.log("  docs/launch/link-audit.csv");
console.log("  docs/launch/crawl-summary.json");
