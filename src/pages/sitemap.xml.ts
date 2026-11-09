import type { APIRoute } from "astro";
import { services, relatedServicePages } from "../data/services";
import { serviceAreas } from "../data/service-areas";
import { campaigns } from "../data/campaigns";
import { blogPosts } from "../data/blog-posts.generated";
import { allGeoPages } from "../lib/geo/resolveGeoPage";

export const prerender = true;

const corePaths = [
  "/",
  "/about-us/",
  "/services/",
  "/contact-us/",
  "/request-a-quote/",
  "/careers/",
  "/privacy-policy/",
  "/terms-and-conditions/",
  "/lawn-care-blog/",
  "/service-areas/",
  "/customer-login-pay-bill/",
];

/** Paths that must never appear in the public sitemap. */
const excludedExact = new Set([
  "/thank-you/",
  "/thank-you-nextdoor/",
  "/test/",
  "/google-reviews/setup/",
]);

function shouldInclude(path: string): boolean {
  if (excludedExact.has(path)) return false;
  if (path.startsWith("/thank-you")) return false;
  if (path.startsWith("/api/")) return false;
  return true;
}

export const GET: APIRoute = ({ site }) => {
  // Always emit the full public URL list so local/staging QA can inspect coverage.
  // Crawling is still gated by robots.txt + meta noindex when PUBLIC_SITE_INDEXING !== "true".
  const siteUrl = (site?.toString() || "https://growgreenweedcontrol.com").replace(/\/$/, "");

  const paths = new Set<string>(corePaths);

  for (const s of services) paths.add(`/${s.slug}/`);
  for (const slug of Object.keys(relatedServicePages)) paths.add(`/${slug}/`);
  for (const a of serviceAreas) paths.add(`/service-areas/${a.slug}/`);
  for (const g of allGeoPages()) paths.add(g.path.endsWith("/") ? g.path : `${g.path}/`);
  for (const c of campaigns) paths.add(`/${c.slug}/`);
  for (const p of blogPosts) paths.add(p.path.endsWith("/") ? p.path : `${p.path}/`);

  const xml = [...paths]
    .filter(shouldInclude)
    .sort()
    .map((p) => `  <url><loc>${siteUrl}${p}</loc><changefreq>weekly</changefreq></url>`)
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xml}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
};
