import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = JSON.parse(
  fs.readFileSync(path.join(root, "_source_extract/pages_readable.json"), "utf8"),
);

function escape(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function fromPlain(slug) {
  const p = pages.find((x) => x.slug === slug);
  let text = p.readable.plain_text;
  text = text.replace(/^[\s\S]*?(?=1\. Scope|1\. Acceptance)/, "");
  const parts = text.split(/(?=\d+\.\s+[A-Z])/);
  const html = [];
  const toc = [];

  for (const part of parts) {
    const hm = part.match(/^(\d+\.\s+[A-Za-z][A-Za-z0-9,&'’ \/-]{3,90}?)\s+/);
    if (!hm) {
      const t = part.trim();
      if (t.length > 40) html.push(`<p>${escape(t)}</p>`);
      continue;
    }
    const heading = hm[1].trim();
    toc.push(heading);
    const body = part.slice(hm[0].length).trim();
    html.push(`<h2 id="${slugify(heading)}">${escape(heading)}</h2>`);

    let buf = "";
    const sentences = body.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [body];
    for (const s of sentences) {
      const t = s.trim();
      if (!t) continue;
      if (`${buf} ${t}`.trim().length > 420) {
        if (buf) html.push(`<p>${escape(buf.trim())}</p>`);
        buf = t;
      } else {
        buf = `${buf} ${t}`.trim();
      }
    }
    if (buf) html.push(`<p>${escape(buf.trim())}</p>`);
  }

  return { title: p.title, toc, html: html.join("\n") };
}

const privacy = fromPlain("privacy-policy");
const terms = fromPlain("terms-and-conditions");

fs.writeFileSync(
  path.join(root, "src/data/legal-content.generated.ts"),
  `/* generated from WP plain_text by scripts/generate-legal-html.mjs */
export const privacy = ${JSON.stringify(privacy, null, 2)} as const;
export const terms = ${JSON.stringify(terms, null, 2)} as const;
`,
);

console.log("privacy", privacy.html.length, "terms", terms.html.length, "toc", privacy.toc.length);
