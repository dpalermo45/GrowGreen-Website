import fs from "node:fs";
import path from "node:path";

export type PageFaq = { q: string; a: string };

export type ContentFeature = { title: string; body: string };
export type ContentRound = { number: string; date: string; title: string; body: string };
export type ContentProcess = { number: string; title: string; body: string };

export type PageStructured = {
  hero_sub?: string;
  local_title?: string;
  local_lead?: string;
  honest_note?: string;
  features?: ContentFeature[];
  rounds?: ContentRound[];
  process?: ContentProcess[];
  real_faqs?: PageFaq[];
};

export type PageContent = {
  slug: string;
  title: string;
  seo_title?: string;
  seo_desc?: string;
  headings: string[];
  paragraphs: string[];
  list_items: string[];
  faqs: PageFaq[];
  plain_len: number;
  plain_text?: string;
  structured?: PageStructured;
};

const SKIP_HEADING = /^(get my free|call |request |ready to|start with|talk with|prefer to|fields marked)/i;
/** WordPress/Divi developer paste, form chrome, and non-body junk (keep user-facing copy only). */
const SKIP_PARA =
  /^(src=|https?:\/\/|facebook|twitter|instagram|©|escapeHtml|Step \d|Fields marked|Move the slider)/i;
const SKIP_PARA_BODY =
  /complete\s+divi|code module|paste this|theme builder|wp fastest|suggested seo|suggested meta description|json post|crm route|do not add it below|replace the entire|growgreenweedcontrol\.com\/wp-json/i;
const BREADCRUMB_OR_FORM =
  /^(home\s*\/|choose an address suggestion|enter your details manually|please enable javascript|couldn'?t confirm your request)/i;
const FORM_CHROME_PARA =
  /fields marked|no payment required\.\s*your service address|share your address and we|json post to|quote request, not a scheduled/i;

/** Collapse whitespace and punctuation for deduping rendered paragraphs against structured blocks. */
export function normalizePlainText(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[\u2019'`"]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "");
}

function contentDir() {
  return path.join(process.cwd(), "src", "data", "content");
}

export function loadPageContent(slug: string): PageContent | null {
  const file = path.join(contentDir(), `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as PageContent & {
    html?: string;
  };
  const structured = raw.structured || {};
  const faqs = (structured.real_faqs?.length ? structured.real_faqs : raw.faqs || []).filter(
    (f) => f.q && f.a && f.a.length > 25,
  );

  return {
    slug: raw.slug,
    title: raw.title,
    seo_title: raw.seo_title,
    seo_desc: raw.seo_desc,
    headings: (raw.headings || []).filter((h) => h && !SKIP_HEADING.test(h)),
    paragraphs: (raw.paragraphs || []).filter((p) => {
      if (!p || p.length < 35) return false;
      if (SKIP_PARA.test(p)) return false;
      if (SKIP_PARA_BODY.test(p)) return false;
      if (BREADCRUMB_OR_FORM.test(p)) return false;
      if (FORM_CHROME_PARA.test(p)) return false;
      if (/600\+|4\.9|★★★★★/i.test(p) && p.length < 140) return false;
      return true;
    }),
    list_items: (raw.list_items || []).filter((x) => {
      if (!x) return false;
      if (/escapeHtml/i.test(x)) return false;
      if (/600\+|4\.9★|4\.9-star/i.test(x) && x.length < 80) return false;
      return true;
    }),
    faqs,
    plain_len: raw.plain_len || 0,
    plain_text: raw.plain_text,
    structured,
  };
}

const PARAS_PER_HEADING = 6;
/** When there is only one H2 bucket, allow a long single section instead of a tiny cap. */
const SINGLE_HEADING_CAP = 40;
const DEFAULT_MAX_SECTIONS = 20;

/** Splits body copy under H2 headings. `maxSectionCount` should match `RichPageBody` maxSections when set. */
export function contentToSections(content: PageContent, maxSectionCount = DEFAULT_MAX_SECTIONS) {
  const paras = content.paragraphs;
  const heads = content.headings.filter((h) => h !== content.title);
  if (!heads.length) return [{ paragraphs: paras.slice(0, 40) }];

  const cap = Math.max(1, maxSectionCount);
  const nHeads = heads.length;
  const perHeadingCap = nHeads === 1 ? SINGLE_HEADING_CAP : PARAS_PER_HEADING;
  const chunk = Math.max(
    perHeadingCap,
    Math.ceil(paras.length / Math.max(nHeads, 1)),
  );
  return heads
    .map((heading, i) => ({
      heading,
      paragraphs: paras.slice(i * chunk, i * chunk + chunk).slice(0, perHeadingCap),
    }))
    .filter((s) => s.paragraphs.length > 0)
    .slice(0, cap);
}
