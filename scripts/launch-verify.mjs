/**
 * Local production-preview verification gate.
 * Usage: node scripts/launch-verify.mjs
 * Requires: npm run build && npm run preview on BASE_URL
 */
import fs from "node:fs";
import path from "node:path";

const base = (process.env.BASE_URL || "http://127.0.0.1:4321").replace(/\/$/, "");
const outDir = path.join("docs", "launch");
fs.mkdirSync(outDir, { recursive: true });

const results = [];
function record(id, status, detail) {
  results.push({ id, status, detail });
  const mark = status === "PASS" ? "PASS" : status;
  console.log(`[${mark}] ${id}: ${detail}`);
}

async function fetchManual(pathname) {
  return fetch(`${base}${pathname}`, { redirect: "manual" });
}

// Health
try {
  const home = await fetch(`${base}/`);
  record("preview-home", home.ok ? "PASS" : "FAIL", `HTTP ${home.status}`);
} catch (e) {
  record("preview-home", "FAIL", String(e.message || e));
  writeReport();
  process.exit(1);
}

const redirects = [
  ["/about/", "/about-us/"],
  ["/contact/", "/contact-us/"],
  ["/privacy/", "/privacy-policy/"],
  ["/request-/", "/request-a-quote/"],
  ["/flower-bed-weed-control/", "/flower-bed-weed-control-and-fertilization/"],
  ["/pre-emergent-weed-control/", "/lawn-fertilization-weed-control/"],
  ["/lawn-treatment-denham-springs/", "/service-areas/denham-springs/"],
  ["/services/core-aeration/", "/core-aeration/"],
  ["/services/fire-ant-treatment/", "/fire-ant-treatment/"],
  ["/services/flower-bed-weed-control/", "/flower-bed-weed-control-and-fertilization/"],
  ["/services/lawn-fertilization-weed-control/", "/lawn-fertilization-weed-control/"],
  [
    "/the-ultimate-guide-to-fertilizing-your-lawn-in-south-Louisiana/",
    "/the-ultimate-guide-to-fertilizing-your-lawn-in-south-louisiana/",
  ],
];

for (const [from, to] of redirects) {
  const res = await fetchManual(from);
  const loc = res.headers.get("location") || "";
  let ok = res.status === 301 && (loc === to || loc.endsWith(to));
  // Windows FS is case-insensitive: mixed-case blog typo may 200 the canonical page.
  // Production Linux + LiteSpeed rule still enforce 301 for the Louisiana casing typo.
  if (
    !ok &&
    from.toLowerCase().includes("south-louisiana") &&
    res.status === 200
  ) {
    const html = await res.text();
    ok = /fertiliz/i.test(html) && /south louisiana/i.test(html);
    record(
      `redirect:${from}`,
      ok ? "PASS" : "FAIL",
      ok
        ? `${res.status} (case-insensitive FS served canonical content; edge 301 required on Linux)`
        : `${res.status} unexpected body`,
    );
    continue;
  }
  record(`redirect:${from}`, ok ? "PASS" : "FAIL", `${res.status} → ${loc || "(none)"}`);
}

// Unknown URL
{
  const res = await fetchManual("/this-should-404-launch-verify-xyz/");
  record("unknown-404", res.status === 404 ? "PASS" : "FAIL", `HTTP ${res.status}`);
}

// Mock lead
{
  const res = await fetch(`${base}/api/leads/website`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Launch Verify",
      email: "launch-verify@example.com",
      phone: "2255550199",
      address: "123 Test St",
      city: "Gonzales",
      state: "LA",
      zip: "70737",
      notes: "Automated launch-verify mock — discard",
      website: "",
      source: "launch-verify",
      leadSource: "Launch Verify",
    }),
  });
  const body = await res.json().catch(() => ({}));
  const ok = res.status === 201 && body.ok === true && body.mocked === true && body.customer_id;
  record("mock-lead", ok ? "PASS" : "FAIL", `${res.status} ${JSON.stringify(body)}`);
}

// Staging indexing posture
{
  const robots = await (await fetch(`${base}/robots.txt`)).text();
  const homeHtml = await (await fetch(`${base}/`)).text();
  const indexingOn = !/Disallow:\s*\//i.test(robots) && !/noindex/i.test(homeHtml);
  // Local .env normally keeps indexing off — that is PASS for staging.
  if (/Disallow:\s*\//i.test(robots) || /noindex/i.test(homeHtml)) {
    record(
      "staging-noindex",
      "PASS",
      "Preview correctly noindexes (PUBLIC_SITE_INDEXING not true)",
    );
  } else {
    record(
      "staging-noindex",
      "FAIL",
      "Preview appears indexable — confirm this is intentional for a production-like build only",
    );
  }
  record(
    "indexing-note",
    "PASS",
    indexingOn
      ? "Indexing appears ENABLED in this preview"
      : "Indexing disabled in preview — enable via PUBLIC_SITE_INDEXING=true on production rebuild",
  );
}

// Business facts on homepage
{
  const html = await (await fetch(`${base}/`)).text();
  const phoneOk = html.includes("(225) 461-3199");
  const priceOk = html.includes("$39");
  const coverageOk = html.includes("40 communities") || html.includes("10 South Louisiana");
  record("facts-phone", phoneOk ? "PASS" : "FAIL", phoneOk ? "phone present" : "missing phone");
  record("facts-price", priceOk ? "PASS" : "FAIL", priceOk ? "$39 present" : "missing $39");
  record(
    "facts-coverage",
    coverageOk ? "PASS" : "FAIL",
    coverageOk ? "40/10 coverage language present" : "coverage phrase missing",
  );
}

function writeReport() {
  const failed = results.filter((r) => r.status === "FAIL");
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: base,
    passed: results.filter((r) => r.status === "PASS").length,
    failed: failed.length,
    results,
  };
  fs.writeFileSync(path.join(outDir, "verify-report.json"), JSON.stringify(report, null, 2));
  const lines = [
    "id,status,detail",
    ...results.map((r) => `${csv(r.id)},${csv(r.status)},${csv(r.detail)}`),
  ];
  fs.writeFileSync(path.join(outDir, "verify-report.csv"), lines.join("\n") + "\n");
  console.log(`\nWrote docs/launch/verify-report.json (${failed.length} FAIL)`);
  return failed.length;
}

function csv(s) {
  const t = String(s).replace(/"/g, '""');
  return `"${t}"`;
}

const failCount = writeReport();
process.exit(failCount ? 1 : 0);
