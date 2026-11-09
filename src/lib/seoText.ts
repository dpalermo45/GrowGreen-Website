/**
 * Normalize marketing SEO strings before they enter <title> / meta description.
 * Content JSON historically stores HTML entities (&amp;) and occasional mojibake
 * from WordPress exports; Astro then HTML-escapes again → &amp;amp; in the DOM.
 */

const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00A0",
};

/** Repair common UTF-8→Latin-1→UTF-8 mojibake for punctuation we use in titles. */
function repairMojibake(input: string): string {
  return input
    .replace(/\u00E2\u0080\u0093|\u00C3\u00A2\u00E2\u0082\u00AC\u00E2\u0080\u009C|â€“/g, "\u2013")
    .replace(/\u00E2\u0080\u0094|â€”/g, "\u2014")
    .replace(/\u00E2\u0080\u0099|â€™/g, "\u2019")
    .replace(/\u00E2\u0080\u009C|â€œ/g, "\u201C")
    .replace(/\u00E2\u0080\u009D|â€/g, "\u201D")
    .replace(/\u00C2\u00A0/g, "\u00A0");
}

function decodeNamedAndNumericEntities(input: string): string {
  return input
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (full, body: string) => {
      const key = body.toLowerCase();
      if (key.startsWith("#x")) {
        const code = Number.parseInt(key.slice(2), 16);
        return Number.isFinite(code) ? String.fromCodePoint(code) : full;
      }
      if (key.startsWith("#")) {
        const code = Number.parseInt(key.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : full;
      }
      return ENTITY_MAP[key] ?? full;
    });
}

/** Decode entities repeatedly so "&amp;amp;" becomes "&". */
export function normalizeSeoText(value: string | undefined | null): string {
  if (!value) return "";
  let out = String(value);
  for (let i = 0; i < 3; i++) {
    const next = decodeNamedAndNumericEntities(out);
    if (next === out) break;
    out = next;
  }
  return repairMojibake(out).trim();
}
