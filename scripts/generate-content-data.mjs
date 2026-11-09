/**
 * Generates src/data/geo-pages.generated.ts and src/data/blog-posts.generated.ts
 * from _source_extract readable JSON. Run: node scripts/generate-content-data.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = JSON.parse(fs.readFileSync(path.join(root, "_source_extract/pages_readable.json"), "utf8"));
const posts = JSON.parse(fs.readFileSync(path.join(root, "_source_extract/posts_readable.json"), "utf8"));

const GEO_PREFIXES = [
  "lawn-fertilization-",
  "lawn-treatment-",
  "lawn-treatments-",
  "weed-control-",
  "fire-ant-treatments-",
];

const NOT_GEO = new Set([
  "lawn-fertilization-weed-control",
  "lawn-care-blog",
  "lawn-fungus",
  "lawn-insects",
]);

function isGeoSlug(slug) {
  if (NOT_GEO.has(slug)) return false;
  return GEO_PREFIXES.some((p) => slug.startsWith(p));
}

/** Region copy variants — rotate by slug hash so pages are not identical. */
function regionSuffix(city, region) {
  if (!region) return "";
  // Avoid "Ascension Parish, Ascension Parish" / "Iberville Parish in Iberville Parish"
  const cityNorm = String(city).toLowerCase().replace(/\s+/g, " ").trim();
  const regionNorm = String(region).toLowerCase().replace(/\s+/g, " ").trim();
  if (cityNorm === regionNorm) return "";
  if (cityNorm.includes(regionNorm) || regionNorm.includes(cityNorm)) return "";
  return region;
}

const INTRO_TEMPLATES = [
  (city, region) => {
    const place = regionSuffix(city, region);
    return `Homeowners in ${city}${place ? `, ${place}` : ""} want lawn treatments that match warm-season turf and local weather — not a one-size national spray schedule.`;
  },
  (city, region) => {
    const place = regionSuffix(city, region);
    return `${city}${place ? ` in ${place}` : ""} sits in a climate where weeds, humidity, and growth spurts show up fast. Grow Green builds programs around those South Louisiana conditions.`;
  },
  (city, region) => {
    const place = regionSuffix(city, region);
    return `From neighborhood lawns in ${city} to nearby communities${place ? ` across ${place}` : ""}, Grow Green focuses on fertilization, weed control, and related treatments — not mowing.`;
  },
  (city, region) =>
    `Looking for lawn fertilization and weed control in ${city}? Our firefighter-owned team serves this area with season-smart applications and clear estimates based on your property.`,
  (city, region) => {
    const place = regionSuffix(city, region);
    return `${city} lawns face the same regional pressures as the rest of${place ? ` ${place}` : " Greater Baton Rouge"}: aggressive weeds, compacted soil, and long growing seasons. Local timing matters.`;
  },
];

const FOCUS_COPY = {
  fertilization:
    "This page focuses on lawn fertilization and weed control for warm-season turf — St. Augustine, centipede, zoysia, and bermuda.",
  treatment:
    "This page covers lawn treatment service for weeds, nutrition, and seasonal monitoring tailored to your property.",
  "weed-control":
    "This page highlights weed-control programs that combine pre- and post-emergent timing with turf nutrition when selected.",
  "fire-ant":
    "This page covers fire ant treatments that address visible mounds and colony activity around lawns and outdoor living areas.",
  parish:
    "This parish hub connects nearby cities we already serve with the same local office, phone number, and estimate process.",
};

function hashSlug(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function inferCity(slug, title) {
  // Longer / more specific keys first so west-baton-rouge wins over baton-rouge, etc.
  const map = [
    ["prairieville", "Prairieville", "Ascension", "Greater Baton Rouge"],
    ["gonzales", "Gonzales", "Ascension", "Greater Baton Rouge"],
    ["west-baton-rouge", "West Baton Rouge", "West Baton Rouge", "Westside"],
    ["denham-springs", "Denham Springs", "Livingston", "Greater Baton Rouge"],
    ["livingston-parish", "Livingston Parish", "Livingston", "Greater Baton Rouge"],
    ["saint-gabriel", "Saint Gabriel", "Iberville", "River Parishes"],
    ["baton-rouge", "Baton Rouge", "East Baton Rouge", "Greater Baton Rouge"],
    ["plaquemine", "Plaquemine", "Iberville", "River Parishes"],
    ["lutcher", "Lutcher", "St. James", "River Parishes"],
    ["laplace", "LaPlace", null, "River Parishes"],
    ["ascension", "Ascension Parish", "Ascension", "Greater Baton Rouge"],
    ["iberville", "Iberville Parish", "Iberville", "River Parishes"],
    ["livingston", "Livingston", "Livingston", "Greater Baton Rouge"],
    ["walker", "Walker", "Livingston", "Greater Baton Rouge"],
    ["central", "Central", "East Baton Rouge", "Greater Baton Rouge"],
    ["springfield", "Springfield", "Livingston", "Greater Baton Rouge"],
    ["addis", "Addis", "West Baton Rouge", "Westside"],
  ];
  for (const [key, name, parish, region] of map) {
    if (slug.includes(key)) return { name, parish, region };
  }
  // Fallback from title
  const m = title.match(/in ([A-Za-z .']+?)(?:,| LA| Louisiana|$)/i);
  return { name: m ? m[1].trim() : title.replace(/Lawn.*/i, "").trim() || "South Louisiana", parish: null, region: "South Louisiana" };
}

function inferFocus(slug) {
  if (slug.includes("fire-ant")) return "fire-ant";
  // Parish hubs first so Iberville / Ascension are not mis-tagged by weed-control / fertilization.
  if (
    slug.includes("parish") ||
    slug.includes("ascension") ||
    slug.includes("west-baton-rouge") ||
    slug.includes("iberville")
  ) {
    return "parish";
  }
  if (slug.includes("weed-control")) return "weed-control";
  if (slug.includes("fertilization")) return "fertilization";
  return "treatment";
}

const NEARBY = {
  "Greater Baton Rouge": ["Baton Rouge", "Prairieville", "Gonzales", "Denham Springs", "Central", "Walker"],
  "River Parishes": ["Plaquemine", "Saint Gabriel", "Lutcher", "LaPlace", "Gonzales"],
  Westside: ["Addis", "Brusly", "Port Allen", "Plaquemine", "Baton Rouge"],
  "South Louisiana": ["Baton Rouge", "Prairieville", "Gonzales", "Denham Springs"],
};

const geoPages = pages
  .filter((p) => isGeoSlug(p.slug))
  .map((p) => {
    const city = inferCity(p.slug, p.title);
    const focus = inferFocus(p.slug);
    const tmpl = INTRO_TEMPLATES[hashSlug(p.slug) % INTRO_TEMPLATES.length];
    const regionLabel = city.parish ? `${city.parish} Parish` : city.region;
    const nearby = (NEARBY[city.region] || NEARBY["South Louisiana"])
      .filter((n) => n.toLowerCase() !== city.name.toLowerCase())
      .slice(0, 5);
    const bodyParas = (p.readable?.paragraphs || [])
      .filter((t) => t && t.length > 40 && !/^src=/i.test(t) && !/600\+|4\.9|★/.test(t))
      .slice(0, 4);

    return {
      slug: p.slug,
      path: p.path,
      title: p.title,
      seoTitle: p.seo_title || `${p.title} | Grow Green Weed Control`,
      seoDesc:
        p.seo_desc ||
        `Lawn fertilization and weed control in ${city.name}, LA. Local firefighter-owned team. Free estimates. Call (225) 461-3199.`,
      cityName: city.name,
      parish: city.parish,
      region: city.region,
      focus,
      intro: tmpl(city.name, regionLabel),
      focusBlurb: FOCUS_COPY[focus],
      nearby,
      bodyParas,
      headings: (p.readable?.headings || []).slice(0, 8),
    };
  });

const outGeo = `/* Auto-generated by scripts/generate-content-data.mjs — do not hand-edit */
export type GeoPage = {
  slug: string;
  path: string;
  title: string;
  seoTitle: string;
  seoDesc: string;
  cityName: string;
  parish: string | null;
  region: string;
  focus: string;
  intro: string;
  focusBlurb: string;
  nearby: string[];
  bodyParas: string[];
  headings: string[];
};

export const geoPages: GeoPage[] = ${JSON.stringify(geoPages, null, 2)};

export const geoPageBySlug = Object.fromEntries(geoPages.map((g) => [g.slug, g])) as Record<string, GeoPage>;
`;

fs.writeFileSync(path.join(root, "src/data/geo-pages.generated.ts"), outGeo);

const priority = new Set([
  "how-to-kill-pickers-stickers-burweed-in-louisiana",
  "the-ultimate-guide-to-fertilizing-your-lawn-in-south-louisiana",
]);

const blogPosts = posts.map((p) => ({
  slug: p.slug,
  path: p.path,
  title: p.title,
  seoTitle: p.seo_title || `${p.title} | Grow Green Weed Control`,
  seoDesc:
    p.seo_desc ||
    (p.readable?.paragraphs || []).find((x) => x && x.length > 80)?.slice(0, 155) ||
    "South Louisiana lawn care guidance from Grow Green Weed Control.",
  priority: priority.has(p.slug),
  headings: p.readable?.headings || [],
  paragraphs: p.readable?.paragraphs || [],
  list_items: p.readable?.list_items || [],
  images: p.readable?.images || [],
  alts: p.readable?.alts || [],
}));

const outBlog = `/* Auto-generated by scripts/generate-content-data.mjs — do not hand-edit */
export type BlogPost = {
  slug: string;
  path: string;
  title: string;
  seoTitle: string;
  seoDesc: string;
  priority: boolean;
  headings: string[];
  paragraphs: string[];
  list_items: string[];
  images: string[];
  alts: string[];
};

export const blogPosts: BlogPost[] = ${JSON.stringify(blogPosts, null, 2)};

export const blogPostBySlug = Object.fromEntries(blogPosts.map((p) => [p.slug, p])) as Record<string, BlogPost>;
`;

fs.writeFileSync(path.join(root, "src/data/blog-posts.generated.ts"), outBlog);

console.log(`Wrote ${geoPages.length} geo pages, ${blogPosts.length} blog posts`);
geoPages.forEach((g) => console.log(" geo", g.path));
