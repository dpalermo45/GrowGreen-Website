import { defineMiddleware } from "astro:middleware";

/**
 * Preserve legacy WP aliases and typo URLs.
 * /test/ is served as a retired noindex page (not redirected).
 *
 * Note: production also keeps dedicated `prerender=false` redirect pages for
 * most aliases (about, contact, …). Case-only typos cannot use distinct files
 * on case-insensitive local disks, so they rely on this middleware plus
 * `astro.config.mjs` redirects and SSR 404 case-folding.
 */
const redirects: Record<string, string> = {
  "/contact": "/contact-us/",
  "/contact/": "/contact-us/",
  "/privacy": "/privacy-policy/",
  "/privacy/": "/privacy-policy/",
  "/request-": "/request-a-quote/",
  "/request-/": "/request-a-quote/",
  "/about": "/about-us/",
  "/about/": "/about-us/",
  "/flower-bed-weed-control": "/flower-bed-weed-control-and-fertilization/",
  "/flower-bed-weed-control/": "/flower-bed-weed-control-and-fertilization/",
  "/lawn-treatment-denham-springs": "/service-areas/denham-springs/",
  "/lawn-treatment-denham-springs/": "/service-areas/denham-springs/",
  "/services/core-aeration": "/core-aeration/",
  "/services/core-aeration/": "/core-aeration/",
  "/services/fire-ant-treatment": "/fire-ant-treatment/",
  "/services/fire-ant-treatment/": "/fire-ant-treatment/",
  "/services/flower-bed-weed-control": "/flower-bed-weed-control-and-fertilization/",
  "/services/flower-bed-weed-control/": "/flower-bed-weed-control-and-fertilization/",
  "/services/lawn-fertilization-weed-control": "/lawn-fertilization-weed-control/",
  "/services/lawn-fertilization-weed-control/": "/lawn-fertilization-weed-control/",
  "/pre-emergent-weed-control": "/lawn-fertilization-weed-control/",
  "/pre-emergent-weed-control/": "/lawn-fertilization-weed-control/",
  "/the-ultimate-guide-to-fertilizing-your-lawn-in-south-Louisiana":
    "/the-ultimate-guide-to-fertilizing-your-lawn-in-south-louisiana/",
  "/the-ultimate-guide-to-fertilizing-your-lawn-in-south-Louisiana/":
    "/the-ultimate-guide-to-fertilizing-your-lawn-in-south-louisiana/",
};

/** Lowercase lookup so hosts that preserve mixed-case paths still redirect. */
const redirectsByLower = new Map(
  Object.entries(redirects).map(([from, to]) => [from.toLowerCase(), to]),
);

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  const target = redirects[path] || redirectsByLower.get(path.toLowerCase());
  // Redirect when the request path is an alias — including case-only typos where
  // path.toLowerCase() already equals the canonical target.
  if (target && target !== path) {
    return context.redirect(target, 301);
  }
  return next();
});
