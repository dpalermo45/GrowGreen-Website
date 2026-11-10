/**
 * Meta Pixel helpers for the marketing site.
 * PageView install: BaseLayout. Lead: post-acceptance quote forms via ggwcTrackMetaLead.
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

/** Client response shape from `POST /api/leads/website/`. */
export type WebsiteLeadClientResponse = {
  ok?: boolean;
  customer_id?: unknown;
  mocked?: boolean;
  ignored?: boolean;
  message?: string;
};

/**
 * Genuine quote acceptance for Meta Lead.
 * Rejects: non-2xx, ok≠true, missing customer_id, honeypot soft-success (ignored).
 * Bare HTTP 2xx alone is not enough.
 */
export function isConfirmedWebsiteLeadAcceptance(
  data: WebsiteLeadClientResponse | null | undefined,
  httpOk: boolean,
): boolean {
  if (!httpOk) return false;
  if (!data || typeof data !== "object") return false;
  if (data.ok !== true) return false;
  if (data.ignored === true) return false;
  if (data.customer_id == null || data.customer_id === "") return false;
  return true;
}

/** browser_event_id / eventID shared with CRM for CAPI dedupe. */
export function normalizeBrowserEventId(raw: string | undefined | null): string {
  const id = String(raw ?? "").trim();
  if (!id || id.length > 200) return "";
  return id;
}

/**
 * Whether to fire browser Meta `Lead`.
 * Skips mock CRM acceptance, denied consent, missing Pixel, empty event id, and dupes.
 */
export function shouldFireMetaLead(opts: {
  accepted: boolean;
  mocked?: boolean | null;
  browserEventId: string | undefined | null;
  marketingConsent?: boolean | null;
  pixelAvailable: boolean;
  alreadyFiredForEventId: boolean;
}): boolean {
  if (!opts.accepted) return false;
  if (opts.mocked === true) return false;
  if (!opts.pixelAvailable) return false;
  if (!isMarketingConsentGranted(opts.marketingConsent)) return false;
  if (!normalizeBrowserEventId(opts.browserEventId)) return false;
  if (opts.alreadyFiredForEventId) return false;
  return true;
}

export const META_LEAD_SESSION_PREFIX = "ggwc_meta_lead:";
