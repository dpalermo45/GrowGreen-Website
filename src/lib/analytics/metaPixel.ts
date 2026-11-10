/**
 * Meta Pixel helpers for the marketing site.
 * PageView-only install lives in BaseLayout; Lead/Subscribe/Purchase are out of scope here.
 */

/** Digits-only Meta Pixel IDs (reject placeholders / accidental tokens). */
export function normalizeMetaPixelId(raw: string | undefined | null): string {
  const id = String(raw ?? "").trim();
  if (!/^\d{5,20}$/.test(id)) return "";
  return id;
}

/**
 * Marketing consent gate shared with CRM snippet docs:
 * unset / true → allowed; explicit false → blocked.
 */
export function isMarketingConsentGranted(
  consent: boolean | undefined | null = undefined,
): boolean {
  return consent !== false;
}

export function isMetaPixelEnabled(opts: {
  pixelId: string | undefined | null;
  marketingConsent?: boolean | null;
}): boolean {
  const pixelId = normalizeMetaPixelId(opts.pixelId);
  if (!pixelId) return false;
  return isMarketingConsentGranted(opts.marketingConsent);
}

/** Prevent double `fbq('init')` in the same browsing context. */
export function shouldInitMetaPixel(opts: {
  enabled: boolean;
  alreadyInitialized: boolean;
}): boolean {
  return opts.enabled && !opts.alreadyInitialized;
}

/**
 * One PageView per distinct path (+ search). Blocks duplicate fires from
 * init + `astro:page-load` on the same URL, or accidental double bootstrap.
 */
export function shouldTrackMetaPageView(opts: {
  enabled: boolean;
  currentPath: string;
  lastTrackedPath: string | null | undefined;
}): boolean {
  if (!opts.enabled) return false;
  const path = String(opts.currentPath || "");
  if (!path) return false;
  return opts.lastTrackedPath !== path;
}
