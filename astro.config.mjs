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
  // Most legacy aliases use dedicated `prerender=false` redirect pages under src/pages/*.
  // Case-only typos cannot use distinct filenames on case-insensitive disks — keep them
  // here and in middleware / SSR 404 case-folding.
  redirects: {
    // Trailing-slash variant only — `trailingSlash: "ignore"` still matches without slash.
    "/the-ultimate-guide-to-fertilizing-your-lawn-in-south-Louisiana/":
      "/the-ultimate-guide-to-fertilizing-your-lawn-in-south-louisiana/",
  },
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
