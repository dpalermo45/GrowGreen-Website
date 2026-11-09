import { readableToArticleHtml } from "./articleHtml";

/** Build legal HTML from heading list + paragraph pool (WP extract is partially ordered). */
export function legalToHtml(data: {
  headings: readonly string[];
  paragraphs: readonly string[];
  list_items?: readonly string[];
}): string {
  // Prefer a structured outline: H2 for numbered sections, H3 for subsections, then remaining paras
  const parts: string[] = [];
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  for (const h of data.headings) {
    if (/^privacy policy$/i.test(h) || /^terms/i.test(h)) continue;
    if (/^\d+\./.test(h)) {
      parts.push(`<h2 id="${slugify(h)}">${escape(h)}</h2>`);
    } else {
      parts.push(`<h3>${escape(h)}</h3>`);
    }
  }

  // Append unique substantive paragraphs not already used as headings
  const headingSet = new Set(data.headings.map((h) => h.toLowerCase()));
  for (const p of data.paragraphs) {
    if (headingSet.has(p.toLowerCase())) continue;
    if (p.length < 40 && !/[.]/.test(p)) continue;
    parts.push(`<p>${escape(p)}</p>`);
  }

  if (data.list_items?.length) {
    parts.push("<ul>");
    for (const item of data.list_items) parts.push(`<li>${escape(item)}</li>`);
    parts.push("</ul>");
  }

  // Fallback if extract is thin
  if (parts.filter((x) => x.startsWith("<p>")).length < 3) {
    return readableToArticleHtml({
      headings: [...data.headings],
      paragraphs: [...data.paragraphs],
      list_items: data.list_items ? [...data.list_items] : [],
    });
  }

  return parts.join("\n");
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
