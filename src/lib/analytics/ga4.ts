/**
 * Google Analytics 4 helpers for the marketing site.
 * Google tag install: BaseLayout. Page views only — no form/PII payloads.
 */

import { isMarketingConsentGranted } from "./metaPixel";

export { isMarketingConsentGranted };

/** GA4 Measurement IDs (G-…). Reject placeholders / accidental tokens. */
export function normalizeGa4MeasurementId(
  raw: string | undefined | null,
): string {
  const id = String(raw ?? "").trim().toUpperCase();
  if (!/^G-[A-Z0-9]{6,20}$/.test(id)) return "";
  return id;
}

export function isGa4Enabled(opts: {
  measurementId: string | undefined | null;
  marketingConsent?: boolean | null;
}): boolean {
  const measurementId = normalizeGa4MeasurementId(opts.measurementId);
  if (!measurementId) return false;
  return isMarketingConsentGranted(opts.marketingConsent);
}

/** Prevent double `gtag('config')` in the same browsing context. */
export function shouldInitGa4(opts: {
  enabled: boolean;
  alreadyInitialized: boolean;
}): boolean {
  return opts.enabled && !opts.alreadyInitialized;
}

/**
 * One page_view per distinct path (+ search). Blocks duplicate fires from
 * init + `astro:page-load` on the same URL, or accidental double bootstrap.
 */
export function shouldTrackGa4PageView(opts: {
  enabled: boolean;
  currentPath: string;
  lastTrackedPath: string | null | undefined;
}): boolean {
  if (!opts.enabled) return false;
  const path = String(opts.currentPath || "");
  if (!path) return false;
  return opts.lastTrackedPath !== path;
}

/** Production Measurement ID (WordPress / live GA4 property). */
export const PROD_GA4_MEASUREMENT_ID = "G-8PF7LD6SRT";
