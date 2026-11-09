import type { GoogleReviewsConfig } from "./config";

/** True when the request host is a loopback address (not via spoofable forwarded headers alone). */
export function isLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

/**
 * Setup / account-selection is allowed only when:
 * - Request hits loopback AND setup is not explicitly disabled, OR
 * - Production-style access with matching GOOGLE_REVIEWS_SETUP_TOKEN header.
 *
 * Hiding a UI button is not enough — this gate returns 404 for public callers.
 */
export function isSetupAccessAllowed(
  request: Request,
  url: URL,
  config: GoogleReviewsConfig,
): boolean {
  if (isLoopbackHost(url.hostname) && config.setupEnabled) {
    return true;
  }

  if (!config.setupToken) return false;
  const header = request.headers.get("x-ggwc-setup-token") || "";
  const auth = request.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  return header === config.setupToken || bearer === config.setupToken;
}

export function isCronAuthorized(request: Request, config: GoogleReviewsConfig): boolean {
  if (!config.cronSecret) return false;
  const auth = request.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim() === config.cronSecret;
  }
  return request.headers.get("x-ggwc-cron-secret") === config.cronSecret;
}
