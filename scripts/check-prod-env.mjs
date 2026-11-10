/**
 * Validate production / staging env readiness for KnownHost deploy.
 * Does not print secret values. Exit 1 if required production keys are missing
 * when MODE=production (default when PUBLIC_SITE_INDEXING=true or --production).
 *
 * Usage:
 *   node scripts/check-prod-env.mjs
 *   node scripts/check-prod-env.mjs --production
 *   node scripts/check-prod-env.mjs --file .env.production
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const fileArg = args.find((a) => a.startsWith("--file="))?.slice("--file=".length);
const filePos = args.indexOf("--file");
const envFile =
  fileArg ||
  (filePos >= 0 ? args[filePos + 1] : null) ||
  (fs.existsSync(".env.production") ? ".env.production" : ".env");
const forceProduction = args.includes("--production");

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const fileEnv = parseEnv(path.resolve(envFile));
const env = { ...fileEnv, ...process.env };

const indexing = env.PUBLIC_SITE_INDEXING === "true";
const production = forceProduction || indexing;
const siteUrl = (env.PUBLIC_SITE_URL || "").replace(/\/$/, "");
const crmMode = (env.GGWC_CRM_MODE || "mock").toLowerCase();

const checks = [];

function add(id, ok, detail) {
  checks.push({ id, ok, detail });
}

add(
  "env-file",
  fs.existsSync(path.resolve(envFile)),
  fs.existsSync(path.resolve(envFile))
    ? `Reading ${envFile}`
    : `Missing ${envFile} (pass --file)`,
);

add(
  "PUBLIC_SITE_URL",
  Boolean(siteUrl),
  siteUrl
    ? production && !/^https:\/\/growgreenweedcontrol\.com$/i.test(siteUrl)
      ? `Set to ${siteUrl} — production should be https://growgreenweedcontrol.com`
      : `Set (${siteUrl.startsWith("https://") ? "https" : siteUrl.startsWith("http://") ? "http" : "other"})`
    : "Missing",
);

if (production) {
  add(
    "PUBLIC_SITE_INDEXING",
    indexing,
    indexing
      ? "true (indexing enabled for this build)"
      : "Must be true for a production indexing build",
  );
  add(
    "canonical-https",
    /^https:\/\//i.test(siteUrl),
    /^https:\/\//i.test(siteUrl) ? "HTTPS canonical" : "Production URL must use https://",
  );
  add(
    "GGWC_CRM_MODE",
    crmMode === "live",
    crmMode === "live" ? "live" : `Got "${crmMode || "empty"}" — production leads need live`,
  );
  add(
    "GGWC_CRM_BASE_URL",
    Boolean(env.GGWC_CRM_BASE_URL?.trim()),
    env.GGWC_CRM_BASE_URL?.trim() ? "Present" : "Missing",
  );
  add(
    "GGWC_CRM_API_KEY",
    Boolean(env.GGWC_CRM_API_KEY?.trim()),
    env.GGWC_CRM_API_KEY?.trim() ? "Present (value hidden)" : "Missing",
  );
  add(
    "GOOGLE_REVIEWS_SETUP_ENABLED",
    env.GOOGLE_REVIEWS_SETUP_ENABLED !== "true",
    env.GOOGLE_REVIEWS_SETUP_ENABLED === "true"
      ? "true — set false in production unless using setup token"
      : "Not forced open (ok)",
  );
} else {
  add(
    "preview-indexing",
    !indexing,
    !indexing
      ? "PUBLIC_SITE_INDEXING is not true (correct for local/staging)"
      : "Indexing is true — use --production checks or rebuild carefully",
  );
  add(
    "CRM-mode-preview",
    crmMode === "mock" || crmMode === "live",
    `GGWC_CRM_MODE=${crmMode || "mock"}`,
  );
}

add(
  "PUBLIC_MAPBOX_TOKEN",
  true,
  env.PUBLIC_MAPBOX_TOKEN?.trim()
    ? "Present (optional autocomplete)"
    : "Empty — manual address entry still works",
);

const metaPixelId = (env.PUBLIC_META_PIXEL_ID || "").trim();
const metaPixelShapeOk = !metaPixelId || /^\d{5,20}$/.test(metaPixelId);
const metaPixelRequiredOk = !production || Boolean(metaPixelId && metaPixelShapeOk);
add(
  "PUBLIC_META_PIXEL_ID",
  metaPixelShapeOk && metaPixelRequiredOk,
  metaPixelId
    ? metaPixelShapeOk
      ? production
        ? "Present (PageView Pixel — rebuild required after changes)"
        : "Present (will load Pixel on this build; leave empty for local/preview)"
      : "Invalid — expected digits-only Meta Pixel ID"
    : production
      ? "Missing — set PUBLIC_META_PIXEL_ID=1014961828315598 and rebuild"
      : "Empty (correct for local/preview — Pixel disabled)",
);

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"}\t${c.id}\t${c.detail}`);
}

console.log("");
console.log(
  production
    ? `Mode: production (${failed.length ? "NOT READY" : "READY for deploy checklist"})`
    : `Mode: preview/staging (${failed.length ? "ISSUES" : "OK"})`,
);
console.log(`File: ${envFile}`);

if (failed.length) {
  process.exit(1);
}
