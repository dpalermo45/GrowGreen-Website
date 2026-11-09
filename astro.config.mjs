import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import { loadEnv } from "vite";

// Load `.env` into process.env for server code that reads private keys via process.env.
// Astro/Vite expose PUBLIC_* on import.meta.env; they do not always populate process.env
// for GOOGLE_REVIEWS_* / CRM secrets. Never overwrite vars already set by the host.
const fileEnv = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
for (const [key, value] of Object.entries(fileEnv)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}
const site =
  process.env.PUBLIC_SITE_URL ||
  "https://growgreenweedcontrol.com";

export default defineConfig({
  site,
  output: "server",
  adapter: node({ mode: "standalone" }),
  // "ignore" keeps preferred trailing-slash URLs while allowing Google's registered
  // OAuth callback (`/api/google-reviews/callback` with no trailing slash) to resolve.
  trailingSlash: "ignore",
  // Legacy WP aliases: dedicated redirect pages under src/pages/* (+ middleware for
  // case-only typos like south-Louisiana). Avoid duplicating those paths in `redirects`
  // here — it collides with the page routes on @astrojs/node.
  compressHTML: true,
  server: {
    port: 4321,
    host: true,
  },
  vite: {
    server: {
      watch: {
        ignored: ["**/website-media/**", "**/_source_extract/**", "**/.media-work/**"],
      },
    },
  },
});
