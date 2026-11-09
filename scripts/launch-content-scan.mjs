/**
 * Scan every sitemap/public HTML page for residual defects.
 */
const base = (process.env.BASE_URL || "http://127.0.0.1:4321").replace(/\/$/, "");
const inventory = JSON.parse(
  await import("node:fs").then((fs) =>
    fs.readFileSync(new URL("../docs/launch/route-inventory.json", import.meta.url), "utf8"),
  ),
);

const paths = inventory.routes
  .filter((r) => !["api", "redirect", "error"].includes(r.type))
  .map((r) => r.path)
  .filter((p) => p.endsWith("/") || p === "/")
  .filter((p) => !p.includes("[") && !p.includes("("));

const issues = [];
const checks = [
  { id: "being-refreshed", re: /being refreshed/i },
  { id: "lush-lawn-mascot", re: /mascot\/lush-lawn/i },
  { id: "localhost-asset", re: /src=["']https?:\/\/localhost/i },
  { id: "placeholder-href", re: /href=["']#["']/i },
  { id: "mowing-offer", re: /we (offer|provide|specialize in) mowing/i },
  { id: "fake-600", re: /600\+\s+local lawns/i },
];

for (const path of paths) {
  let html = "";
  try {
    const res = await fetch(`${base}${path}`);
    if (!res.ok) {
      issues.push({ path, id: "http-status", detail: String(res.status) });
      continue;
    }
    html = await res.text();
  } catch (e) {
    issues.push({ path, id: "fetch-error", detail: String(e.message || e) });
    continue;
  }
  for (const c of checks) {
    if (c.re.test(html)) issues.push({ path, id: c.id, detail: "matched" });
  }
  if (!/<h1[\s>]/i.test(html) && !path.includes("thank-you") && path !== "/robots.txt") {
    // soft: some utility pages may lack h1
    if (!["/sitemap.xml", "/robots.txt"].includes(path)) {
      issues.push({ path, id: "missing-h1", detail: "no h1" });
    }
  }
}

const fs = await import("node:fs");
fs.mkdirSync("docs/launch", { recursive: true });
const lines = ["path,id,detail", ...issues.map((i) => `"${i.path}","${i.id}","${i.detail}"`)];
fs.writeFileSync("docs/launch/content-scan.csv", lines.join("\n") + "\n");
fs.writeFileSync(
  "docs/launch/content-scan.json",
  JSON.stringify({ generatedAt: new Date().toISOString(), scanned: paths.length, issueCount: issues.length, issues }, null, 2),
);
console.log(`Scanned ${paths.length} pages; ${issues.length} issues → docs/launch/content-scan.csv`);
process.exit(issues.length ? 1 : 0);
