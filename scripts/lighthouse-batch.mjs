/**
 * Run Lighthouse mobile audits N times per URL and print median metrics.
 * Usage: node scripts/lighthouse-batch.mjs [label] [outdir]
 * Requires a stable preview at BASE_URL (default http://127.0.0.1:4321).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const label = process.argv[2] || "run";
const outDir = path.resolve(process.argv[3] || `.lighthouse/${label}`);
fs.mkdirSync(outDir, { recursive: true });

const base = (process.env.BASE_URL || "http://127.0.0.1:4321").replace(/\/$/, "");
const pages = [
  { id: "home", path: "/" },
  { id: "quote", path: "/request-a-quote/" },
  { id: "service", path: "/lawn-fertilization-weed-control/" },
  { id: "service-area", path: "/service-areas/prairieville/" },
  { id: "blog", path: "/how-to-kill-pickers-stickers-burweed-in-louisiana/" },
];
const runs = 3;

async function waitForServer(url, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Preview not reachable at ${url}`);
}

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function runLighthouse(url, outJson) {
  return new Promise((resolve, reject) => {
    const args = [
      "--yes",
      "lighthouse",
      url,
      "--only-categories=performance",
      "--form-factor=mobile",
      "--screenEmulation.mobile=true",
      "--throttling-method=simulate",
      "--output=json",
      `--output-path=${outJson}`,
      "--chrome-flags=--headless=new --no-sandbox --disable-gpu --ignore-certificate-errors",
      "--quiet",
    ];
    const child = spawn("npx", args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      cwd: process.cwd(),
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`lh exit ${code}`))));
  });
}

function extract(report) {
  const a = report.audits;
  const jsBytes = (a["network-requests"]?.details?.items || [])
    .filter((i) => i.resourceType === "Script" || String(i.mimeType || "").includes("javascript"))
    .reduce((sum, i) => sum + (i.transferSize || 0), 0);
  return {
    performance: Math.round((report.categories.performance?.score || 0) * 100),
    lcp: a["largest-contentful-paint"]?.numericValue ?? null,
    cls: a["cumulative-layout-shift"]?.numericValue ?? null,
    tbt: a["total-blocking-time"]?.numericValue ?? null,
    weight: a["total-byte-weight"]?.numericValue ?? null,
    jsWeight: jsBytes,
  };
}

await waitForServer(`${base}/`);
console.log(`Lighthouse batch against ${base}`);

const summary = {};

for (const page of pages) {
  const metrics = [];
  for (let i = 1; i <= runs; i++) {
    const outJson = path.join(outDir, `${page.id}-run${i}.json`);
    console.log(`\n=== ${label} ${page.id} run ${i}/${runs} ===`);
    await runLighthouse(`${base}${page.path}`, outJson);
    const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
    metrics.push(extract(report));
  }
  summary[page.id] = {
    path: page.path,
    runs: metrics,
    median: {
      performance: median(metrics.map((m) => m.performance)),
      lcp_ms: Math.round(median(metrics.map((m) => m.lcp))),
      cls: Number(median(metrics.map((m) => m.cls)).toFixed(3)),
      tbt_ms: Math.round(median(metrics.map((m) => m.tbt))),
      weight_kb: Math.round(median(metrics.map((m) => m.weight)) / 1024),
      js_kb: Math.round(median(metrics.map((m) => m.jsWeight)) / 1024),
    },
  };
}

const outPath = path.join(outDir, "summary.json");
fs.writeFileSync(outPath, JSON.stringify({ label, when: new Date().toISOString(), base, summary }, null, 2));
console.log("\nSUMMARY", JSON.stringify(summary, null, 2));
console.log("Wrote", outPath);
