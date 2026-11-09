import path from "node:path";
import { site } from "../../data/site";
import { resolveServerEnv } from "../loadDotEnv";

const SCOPE = "https://www.googleapis.com/auth/business.manage";

/** Soft cache TTL default: 6 hours. */
const DEFAULT_CACHE_TTL_SECONDS = 6 * 60 * 60;
/** Absolute retention must never exceed Google's 30-day temporary storage policy. */
const MAX_CACHE_AGE_SECONDS = 30 * 24 * 60 * 60;
const DEFAULT_DISPLAY_COUNT = 3;

export type GoogleReviewsConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  dataDir: string;
  cacheTtlSeconds: number;
  cacheMaxAgeSeconds: number;
  displayCount: number;
  setupEnabled: boolean;
  setupToken: string;
  cronSecret: string;
  googleProfileUrl: string;
  scope: string;
  oauthOrigin: string;
};

function intEnv(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const raw = env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * OAuth must use the registered localhost origin — never silently switch to 127.0.0.1.
 */
export function resolveOAuthOrigin(env: NodeJS.ProcessEnv = resolveServerEnv()): string {
  const configured = (env.PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
  if (configured.startsWith("http://localhost:") || configured === "http://localhost") {
    return configured || "http://localhost:4321";
  }
  // Prefer explicit localhost redirect even if PUBLIC_SITE_URL points elsewhere during local OAuth.
  if (env.GOOGLE_REVIEWS_REDIRECT_URI?.includes("://localhost")) {
    try {
      const u = new URL(env.GOOGLE_REVIEWS_REDIRECT_URI);
      return `${u.protocol}//${u.host}`;
    } catch {
      /* fall through */
    }
  }
  return "http://localhost:4321";
}

export function readGoogleReviewsConfig(
  explicitEnv?: NodeJS.ProcessEnv,
): GoogleReviewsConfig {
  const env = resolveServerEnv(explicitEnv);
  const dataDir = path.resolve(
    process.cwd(),
    env.GOOGLE_REVIEWS_DATA_DIR || ".data/google-reviews",
  );
  const redirectUri =
    env.GOOGLE_REVIEWS_REDIRECT_URI?.trim() ||
    "http://localhost:4321/api/google-reviews/callback";

  const cacheTtlSeconds = Math.min(
    intEnv(env, "GOOGLE_REVIEWS_CACHE_TTL_SECONDS", DEFAULT_CACHE_TTL_SECONDS),
    MAX_CACHE_AGE_SECONDS,
  );
  const cacheMaxAgeSeconds = Math.min(
    intEnv(env, "GOOGLE_REVIEWS_CACHE_MAX_AGE_SECONDS", MAX_CACHE_AGE_SECONDS),
    MAX_CACHE_AGE_SECONDS,
  );

  return {
    clientId: (env.GOOGLE_REVIEWS_CLIENT_ID || "").trim(),
    clientSecret: (env.GOOGLE_REVIEWS_CLIENT_SECRET || "").trim(),
    redirectUri,
    dataDir,
    cacheTtlSeconds,
    cacheMaxAgeSeconds,
    displayCount: intEnv(env, "GOOGLE_REVIEWS_DISPLAY_COUNT", DEFAULT_DISPLAY_COUNT),
    setupEnabled: env.GOOGLE_REVIEWS_SETUP_ENABLED !== "false",
    setupToken: (env.GOOGLE_REVIEWS_SETUP_TOKEN || "").trim(),
    cronSecret: (env.GOOGLE_REVIEWS_CRON_SECRET || "").trim(),
    googleProfileUrl: site.social.google,
    scope: SCOPE,
    oauthOrigin: resolveOAuthOrigin(env),
  };
}

export function hasOAuthCredentials(config: GoogleReviewsConfig): boolean {
  return Boolean(config.clientId && config.clientSecret && config.redirectUri);
}

export { SCOPE, MAX_CACHE_AGE_SECONDS };
