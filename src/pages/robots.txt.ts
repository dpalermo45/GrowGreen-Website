import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const indexingEnabled = import.meta.env.PUBLIC_SITE_INDEXING === "true";
  const siteUrl = (site?.toString() || "https://growgreenweedcontrol.com").replace(/\/$/, "");

  const body = indexingEnabled
    ? `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /test/\n\nSitemap: ${siteUrl}/sitemap.xml\n`
    : `User-agent: *\nDisallow: /\n\n# PUBLIC_SITE_INDEXING is not enabled — preview/staging.\n`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
