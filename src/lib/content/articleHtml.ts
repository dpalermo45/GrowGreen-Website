/**
 * Convert WP readable extract (headings + paragraphs) into simple article HTML.
 * Skips boilerplate sidebar/CTA headings that appear on many legacy posts.
 */
const SKIP_HEADINGS = new Set([
  "get a free online quote in under 24 hours",
  "lawn treatment program",
  "flower bed weed program",
  "fire ant treatment",
  "call or text for a free quote",
]);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isBoilerplateHeading(h: string): boolean {
  return SKIP_HEADINGS.has(h.trim().toLowerCase());
}

function looksLikeHeading(p: string): boolean {
  const t = p.trim();
  if (t.length < 3 || t.length > 90) return false;
  if (/[.!?]$/.test(t)) return false;
  if (/^(src=|https?:)/i.test(t)) return false;
  return /^[A-Z0-9]/.test(t) && t.split(/\s+/).length <= 12;
}

export type ReadableBlock = {
  headings?: string[];
  paragraphs?: string[];
  list_items?: string[];
};

/**
 * Interleave headings with following paragraphs when possible.
 * Falls back to sequential paragraphs with heuristic subheads.
 */
export function readableToArticleHtml(readable: ReadableBlock, opts?: { prioritize?: boolean }): string {
  const headings = (readable.headings || []).filter((h) => !isBoilerplateHeading(h));
  const paragraphs = (readable.paragraphs || []).filter((p) => {
    const t = p.trim();
    if (!t) return false;
    if (/^src=/i.test(t)) return false;
    if (/^(facebook|twitter|instagram)$/i.test(t)) return false;
    if (/^\(\d{3}\)/.test(t) && t.length < 20) return false;
    // Drop scrubbed social-proof noise lines
    if (/600\+|4\.9|★|star Google/i.test(t) && t.length < 220) return false;
    return true;
  });

  const parts: string[] = [];
  let pi = 0;

  if (opts?.prioritize && headings.length) {
    // Prefer structured heading → content flow for priority articles
    for (const h of headings) {
      parts.push(`<h2>${escapeHtml(h)}</h2>`);
      // Consume paragraphs until we hit one that matches next heading or run short
      let added = 0;
      while (pi < paragraphs.length && added < 6) {
        const p = paragraphs[pi];
        if (headings.some((hh) => hh === p)) {
          pi++;
          break;
        }
        if (looksLikeHeading(p) && headings.includes(p)) {
          break;
        }
        // Skip duplicate heading-as-paragraph
        if (p === h) {
          pi++;
          continue;
        }
        parts.push(`<p>${escapeHtml(p)}</p>`);
        pi++;
        added++;
        // Stop if next remaining heading appears as next paragraph
        if (pi < paragraphs.length && headings.includes(paragraphs[pi])) break;
      }
    }
    while (pi < paragraphs.length) {
      const p = paragraphs[pi++];
      if (headings.includes(p) || isBoilerplateHeading(p)) continue;
      parts.push(`<p>${escapeHtml(p)}</p>`);
    }
  } else {
    // Simple: emit unique headings first section, then remaining paragraphs
    const usedHeadings = new Set<string>();
    for (const p of paragraphs) {
      if (headings.includes(p) && !usedHeadings.has(p)) {
        usedHeadings.add(p);
        parts.push(`<h2>${escapeHtml(p)}</h2>`);
        continue;
      }
      if (looksLikeHeading(p) && headings.some((h) => h.toLowerCase() === p.toLowerCase())) {
        parts.push(`<h2>${escapeHtml(p)}</h2>`);
        continue;
      }
      parts.push(`<p>${escapeHtml(p)}</p>`);
    }
    // If almost no content, fall back to headings + first paragraphs
    if (parts.length < 3) {
      for (const h of headings.slice(0, 8)) {
        parts.push(`<h2>${escapeHtml(h)}</h2>`);
      }
      for (const p of paragraphs.slice(0, 12)) {
        parts.push(`<p>${escapeHtml(p)}</p>`);
      }
    }
  }

  const lists = readable.list_items || [];
  if (lists.length) {
    // Skip list items already emitted as paragraphs (common WP extract duplication).
    const emitted = new Set(
      parts
        .map((part) => part.replace(/^<p>|<\/p>$/g, "").trim())
        .filter(Boolean),
    );
    const uniqueLists = lists.filter((item) => {
      const t = item.trim();
      return t.length > 0 && !emitted.has(t);
    });
    if (uniqueLists.length) {
      parts.push("<ul>");
      for (const item of uniqueLists.slice(0, 40)) {
        parts.push(`<li>${escapeHtml(item)}</li>`);
      }
      parts.push("</ul>");
    }
  }

  return parts.join("\n");
}
