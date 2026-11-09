import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "docs/url-migration-manifest.json"), "utf8"),
);
const pagesDir = path.join(root, "src/pages");

function listAstro(dir, base = "") {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith("_")) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...listAstro(full, `${base}/${ent.name}`));
    else if (ent.name.endsWith(".astro") || ent.name.endsWith(".ts")) {
      out.push(`${base}/${ent.name}`);
    }
  }
  return out;
}

const files = listAstro(pagesDir);
const retained = manifest.urls.filter((u) => u.outcome === "retained");
let missing = [];
for (const u of retained) {
  const slug = u.path === "/" ? "index.astro" : `${u.path.replace(/^\/|\/$/g, "")}.astro`;
  const hit = files.some((f) => f.replace(/\\/g, "/").endsWith(slug) || f.includes(`/${slug}`));
  // service-areas dynamic
  if (u.path.startsWith("/service-areas/") && u.path !== "/service-areas/") continue;
  if (!hit && !files.some((f) => f.includes(u.path.replaceAll("/", "")))) {
    // soft check: file named by slug
    const named = path.join(pagesDir, slug);
    if (!fs.existsSync(named)) missing.push(u.path);
  }
}

console.log("astro page files:", files.length);
console.log("retained URLs:", retained.length);
console.log("missing page files (approx):", missing.length);
missing.slice(0, 30).forEach((m) => console.log(" ", m));
