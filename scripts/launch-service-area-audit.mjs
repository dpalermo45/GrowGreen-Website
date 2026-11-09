/**
 * Service-area content audit against BASE_URL preview.
 *
 *   npm run launch:service-areas
 *
 * Writes docs/launch/service-area-audit.csv
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  ensureLaunchDir,
  extractFirstH1,
  extractTitle,
  fetchWithOneRedirect,
  parishLabel,
  parseBaseUrl,
  probeServer,
  stripTags,
  verifyBusinessFacts,
  writeCsv,
} from "./launch-audit-lib.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadServiceAreas() {
  const mod = await import(
    pathToFileURL(path.join(projectRoot, "src/data/service-areas.ts")).href
  );
  return { serviceAreas: mod.serviceAreas, serviceAreaHubs: mod.serviceAreaHubs };
}

const base = parseBaseUrl();
const { serviceAreas, serviceAreaHubs } = await loadServiceAreas();

const CROSS_SAMPLE_SIZE = 20;
const crossSampleSlugs = new Set(
  serviceAreas.slice(0, CROSS_SAMPLE_SIZE).map((a) => a.slug),
);

/** @type {{ kind: string, slug: string, name: string, path: string, parish: string, region?: string }[]} */
const auditTargets = [
  {
    kind: "index",
    slug: "",
    name: "Service areas",
    path: "/service-areas/",
    parish: "",
  },
];

for (const area of serviceAreas) {
  auditTargets.push({
    kind: "city",
    slug: area.slug,
    name: area.name,
    path: `/service-areas/${area.slug}/`,
    parish: area.parish,
    region: area.region,
  });
}

for (const hub of serviceAreaHubs) {
  auditTargets.push({
    kind: "hub",
    slug: hub.slug,
    name: hub.name,
    path: hub.existingUrl.endsWith("/") ? hub.existingUrl : `${hub.existingUrl}/`,
    parish: hub.parish,
  });
}

const otherCityNames = serviceAreas.map((a) => a.name);
const otherHubNames = serviceAreaHubs.map((h) => h.name);

function containsName(text, name) {
  if (!text || !name) return false;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

function crossCityBleed(expectedName, h1, title) {
  const bleedInH1 = [];
  const bleedInTitle = [];
  for (const other of [...otherCityNames, ...otherHubNames]) {
    if (other.toLowerCase() === expectedName.toLowerCase()) continue;
    if (h1 && containsName(h1, other) && !containsName(h1, expectedName)) {
      bleedInH1.push(other);
    }
    if (title && containsName(title, other) && !containsName(title, expectedName)) {
      bleedInTitle.push(other);
    }
  }
  return { bleedInH1, bleedInTitle };
}

const probe = await probeServer(base);
const rows = [];

for (const target of auditTargets) {
  const pageUrl = new URL(target.path, base);
  let status = 0;
  let finalUrl = String(pageUrl);
  let html = "";
  let fetchError = "";

  if (!probe.ok) {
    fetchError = probe.error || "connection-failed";
  } else {
    try {
      const result = await fetchWithOneRedirect(pageUrl);
      status = result.status;
      finalUrl = result.finalUrl;
      if (result.response.ok) html = await result.response.text();
    } catch (err) {
      fetchError = err instanceof Error ? err.message : String(err);
    }
  }

  const title = html ? extractTitle(html) : "";
  const h1 = html ? extractFirstH1(html) : "";
  const bodyText = html ? stripTags(html) : "";

  const cityInTitle =
    target.kind === "index"
      ? title.length > 0
      : target.name
        ? containsName(title, target.name)
        : title.length > 0;
  const cityInH1 =
    target.kind === "index"
      ? h1.length > 0
      : target.name
        ? containsName(h1, target.name)
        : h1.length > 0;

  const expectedParishLabel = target.parish ? parishLabel(target.parish) : "";
  const parishInBody =
    !expectedParishLabel ||
    containsName(bodyText, expectedParishLabel) ||
    containsName(bodyText, target.parish);

  const inCrossSample =
    target.kind === "city" && crossSampleSlugs.has(target.slug);

  let crossH1 = "";
  let crossTitle = "";
  if (inCrossSample && target.name) {
    const bleed = crossCityBleed(target.name, h1, title);
    crossH1 = bleed.bleedInH1.join("; ");
    crossTitle = bleed.bleedInTitle.join("; ");
  }

  const factIssues = bodyText ? verifyBusinessFacts(bodyText) : [];

  const issues = [];
  if (fetchError) issues.push(`fetch:${fetchError}`);
  if (status && status >= 400) issues.push(`http:${status}`);
  if (target.name && !cityInTitle) issues.push("city-missing-in-title");
  if (target.name && h1 && !cityInH1) issues.push("city-missing-in-h1");
  if (!parishInBody && target.parish) issues.push("parish-missing-in-body");
  if (crossH1) issues.push(`cross-contamination-h1:${crossH1}`);
  if (crossTitle) issues.push(`cross-contamination-title:${crossTitle}`);
  issues.push(...factIssues);

  rows.push({
    kind: target.kind,
    slug: target.slug,
    cityOrHub: target.name,
    path: target.path,
    parish: target.parish,
    region: target.region ?? "",
    httpStatus: fetchError ? "error" : status,
    finalUrl,
    title,
    h1,
    cityInTitle: cityInTitle ? "yes" : "no",
    cityInH1: cityInH1 ? "yes" : "no",
    parishConsistent: parishInBody ? "yes" : "no",
    crossSample: inCrossSample ? "yes" : "no",
    crossBleedH1: crossH1,
    crossBleedTitle: crossTitle,
    businessFactIssues: factIssues.join("; "),
    issues: issues.join("; "),
  });
}

const headers = [
  "kind",
  "slug",
  "cityOrHub",
  "path",
  "parish",
  "region",
  "httpStatus",
  "finalUrl",
  "title",
  "h1",
  "cityInTitle",
  "cityInH1",
  "parishConsistent",
  "crossSample",
  "crossBleedH1",
  "crossBleedTitle",
  "businessFactIssues",
  "issues",
];

const outDir = ensureLaunchDir();
const outPath = path.join(outDir, "service-area-audit.csv");
writeCsv(outPath, headers, rows);

const issueCount = rows.filter((r) => r.issues && r.issues.length > 0).length;

console.log("Grow Green — service area audit");
console.log(`Targets: ${rows.length} (${serviceAreas.length} cities + ${serviceAreaHubs.length} hubs + index)`);
console.log(`Rows with issues: ${issueCount}`);
if (!probe.ok) {
  console.warn("WARNING: Preview server not reachable — re-run with npm run preview.");
}
console.log(`Written: docs/launch/service-area-audit.csv`);
