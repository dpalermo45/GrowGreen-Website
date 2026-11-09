/**
 * Shared helpers for pre-launch production-preview audits.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(__dirname, "..");

export const EXPECTED_PHONE = "(225) 461-3199";
export const EXPECTED_PHONE_DIGITS = "2254613199";
export const EXPECTED_PRICE_SNIPPET = "$39";

const UA = "GrowGreenLaunchAudit/1.0 (+pre-launch; office@growgreenweedcontrol.com)";

export function ensureLaunchDir() {
  const dir = path.join(projectRoot, "docs/launch");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function loadRouteInventory({ regenerate = false } = {}) {
  const invPath = path.join(projectRoot, "docs/launch/route-inventory.json");
  if (regenerate || !fs.existsSync(invPath)) {
    const r = spawnSync(
      process.execPath,
      ["--experimental-strip-types", path.join(projectRoot, "scripts/launch-inventory.mjs")],
      { cwd: projectRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    if (r.status !== 0) {
      throw new Error(
        `launch-inventory failed: ${r.stderr || r.stdout || `exit ${r.status}`}`,
      );
    }
  }
  return JSON.parse(fs.readFileSync(invPath, "utf8"));
}

/** Concrete HTML/public crawl targets (skip api, dynamic templates, robots/sitemap). */
export function crawlPathsFromInventory(inventory) {
  const skipTypes = new Set(["api"]);
  return inventory.routes
    .filter((r) => !skipTypes.has(r.type))
    .filter((r) => !r.path.includes("["))
    .filter((r) => r.path !== "/robots.txt" && r.path !== "/sitemap.xml")
    .map((r) => ({ path: r.path, pageType: r.type }));
}

export function csvEscape(value) {
  const s = value == null ? "" : String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function writeCsv(filePath, headers, rows) {
  const lines = [headers.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

export function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchAttr(chunk, name) {
  const re = new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, "i");
  const re2 = new RegExp(`\\s${name}\\s*=\\s*([^\\s>]+)`, "i");
  return (chunk.match(re) || chunk.match(re2))?.[1] ?? "";
}

export function parseBaseUrl(env = process.env) {
  const raw = (env.BASE_URL || "http://127.0.0.1:4321").replace(/\/$/, "");
  return new URL(raw);
}

export function normalizePathname(p) {
  try {
    if (p.startsWith("http://") || p.startsWith("https://")) {
      return new URL(p).pathname;
    }
  } catch {
    /* fall through */
  }
  if (!p.startsWith("/")) return null;
  if (p === "/") return "/";
  return p.endsWith("/") ? p : `${p}/`;
}

export function resolveHref(baseUrl, href) {
  if (!href || href.startsWith("#") || /^javascript:/i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href)) {
    return null;
  }
  try {
    return new URL(href, baseUrl);
  } catch {
    return null;
  }
}

export function isSameOrigin(baseOrigin, url) {
  return url.origin === baseOrigin;
}

/**
 * Fetch with redirect:manual; follow Location once for 301–308.
 */
export async function fetchWithOneRedirect(url, { accept = "text/html" } = {}) {
  const first = await fetch(url, {
    redirect: "manual",
    headers: { "User-Agent": UA, Accept: accept },
  });
  let status = first.status;
  let finalUrl = url;
  let response = first;

  if (status >= 301 && status <= 308) {
    const loc = first.headers.get("location");
    if (loc) {
      finalUrl = new URL(loc, url);
      response = await fetch(finalUrl, {
        redirect: "manual",
        headers: { "User-Agent": UA, Accept: accept },
      });
      status = response.status;
    }
  }

  return { status, finalUrl: String(finalUrl), response };
}

export async function checkUrlStatus(url, { preferHead = true } = {}) {
  try {
    if (preferHead) {
      const head = await fetch(url, {
        method: "HEAD",
        redirect: "manual",
        headers: { "User-Agent": UA },
      });
      if (head.status === 405 || head.status === 501) {
        /* fall through to GET */
      } else if (head.status >= 301 && head.status <= 308) {
        const loc = head.headers.get("location");
        if (loc) return checkUrlStatus(new URL(loc, url), { preferHead });
        return head.status;
      } else {
        return head.status;
      }
    }
    const get = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": UA, Accept: "*/*" },
    });
    if (get.status >= 301 && get.status <= 308) {
      const loc = get.headers.get("location");
      if (loc) return checkUrlStatus(new URL(loc, url), { preferHead: false });
    }
    return get.status;
  } catch {
    return 0;
  }
}

export function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? stripTags(m[1]) : "";
}

export function extractMetaContent(html, key, { prop = false } = {}) {
  const attr = prop ? "property" : "name";
  const re = new RegExp(
    `<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']*)["'][^>]*>`,
    "i",
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${key}["'][^>]*>`,
    "i",
  );
  return (html.match(re) || html.match(re2))?.[1]?.trim() ?? "";
}

export function extractCanonical(html) {
  const re = /<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    return matchAttr(m[0], "href");
  }
  return "";
}

export function extractFirstH1(html) {
  const m = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? stripTags(m[1]) : "";
}

export function hasH1(html) {
  return /<h1\b/i.test(html);
}

export function extractAnchors(html) {
  const out = [];
  const re = /<a\b[^>]*href\s*=\s*["']([^"']*)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

export function extractImages(html) {
  const out = [];
  const re = /<img\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const src = matchAttr(m[0], "src");
    if (src) out.push(src);
  }
  return out;
}

export function extractJsonLdBlocks(html) {
  const out = [];
  const re =
    /<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    const raw = m[1].trim();
    if (raw) out.push(raw);
  }
  return out;
}

/** Collect http(s) URLs from JSON-LD (same-origin filtering applied by caller). */
export function urlsFromJsonLd(jsonText) {
  const urls = new Set();
  try {
    const data = JSON.parse(jsonText);
    walkJson(data, urls);
  } catch {
    const re = /https?:\/\/[^\s"'<>]+/g;
    let m;
    while ((m = re.exec(jsonText))) urls.add(m[0]);
  }
  return [...urls];
}

function walkJson(node, urls) {
  if (node == null) return;
  if (typeof node === "string") {
    if (/^https?:\/\//i.test(node)) urls.add(node);
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) walkJson(item, urls);
    return;
  }
  if (typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (k === "url" || k === "@id" || k.endsWith("Url")) {
        if (typeof v === "string" && /^https?:\/\//i.test(v)) urls.add(v);
      }
      walkJson(v, urls);
    }
  }
}

export function parishLabel(parish) {
  return /parish$/i.test(parish) ? parish : `${parish} Parish`;
}

/** Returns issues if phone/price mentions look wrong. */
export function verifyBusinessFacts(text) {
  const issues = [];
  const digits = text.replace(/\D/g, "");
  const hasPhoneShape = /\(?\s*225\s*\)?[\s.-]*461[\s.-]*3199/.test(text) || digits.includes("2254613199");
  const wrongPhone =
    /\(?\s*225\s*\)?[\s.-]*\d{3}[\s.-]*\d{4}/.test(text) &&
    !hasPhoneShape &&
    /\b225\b/.test(text);
  if (wrongPhone) issues.push("phone-mismatch");

  if (/\$?\s*39\s*(?:\/|\s*per\s*)?month/i.test(text) || /\$\s*\d+\s*\/\s*month/i.test(text)) {
    if (!/\$?\s*39\s*(?:\/|\s*per\s*)?month/i.test(text)) {
      issues.push("price-not-39-month");
    }
  }
  return issues;
}

export async function probeServer(baseUrl) {
  try {
    const r = await fetch(new URL("/", baseUrl), {
      redirect: "manual",
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(8000),
    });
    return { ok: true, status: r.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
