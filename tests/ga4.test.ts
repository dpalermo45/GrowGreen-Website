import { describe, expect, it } from "vitest";
import {
  isGa4Enabled,
  isMarketingConsentGranted,
  normalizeGa4MeasurementId,
  PROD_GA4_MEASUREMENT_ID,
  shouldInitGa4,
  shouldTrackGa4PageView,
} from "../src/lib/analytics/ga4";

describe("normalizeGa4MeasurementId", () => {
  it("accepts the production Measurement ID", () => {
    expect(normalizeGa4MeasurementId(PROD_GA4_MEASUREMENT_ID)).toBe(
      PROD_GA4_MEASUREMENT_ID,
    );
    expect(normalizeGa4MeasurementId("g-8pf7ld6srt")).toBe(
      PROD_GA4_MEASUREMENT_ID,
    );
  });

  it("rejects empty, whitespace, and non-GA4 IDs (local/preview gating)", () => {
    expect(normalizeGa4MeasurementId("")).toBe("");
    expect(normalizeGa4MeasurementId("   ")).toBe("");
    expect(normalizeGa4MeasurementId(undefined)).toBe("");
    expect(normalizeGa4MeasurementId(null)).toBe("");
    expect(normalizeGa4MeasurementId("not-a-ga4")).toBe("");
    expect(normalizeGa4MeasurementId("GTM-XXXX")).toBe("");
    expect(normalizeGa4MeasurementId("UA-123456-1")).toBe("");
    expect(normalizeGa4MeasurementId("1014961828315598")).toBe("");
  });
});

describe("consent + enablement", () => {
  it("shares Meta Pixel consent semantics (unset = granted)", () => {
    expect(isMarketingConsentGranted(undefined)).toBe(true);
    expect(isMarketingConsentGranted(null)).toBe(true);
    expect(isMarketingConsentGranted(true)).toBe(true);
    expect(isMarketingConsentGranted(false)).toBe(false);
  });

  it("disables GA4 when PUBLIC_GA_MEASUREMENT_ID is unset", () => {
    expect(isGa4Enabled({ measurementId: "" })).toBe(false);
    expect(isGa4Enabled({ measurementId: undefined })).toBe(false);
  });

  it("enables GA4 for a valid ID when consent is not denied", () => {
    expect(isGa4Enabled({ measurementId: PROD_GA4_MEASUREMENT_ID })).toBe(
      true,
    );
    expect(
      isGa4Enabled({
        measurementId: PROD_GA4_MEASUREMENT_ID,
        marketingConsent: true,
      }),
    ).toBe(true);
  });

  it("blocks GA4 when marketing consent is explicitly false", () => {
    expect(
      isGa4Enabled({
        measurementId: PROD_GA4_MEASUREMENT_ID,
        marketingConsent: false,
      }),
    ).toBe(false);
  });
});

describe("duplicate init / page_view guards", () => {
  it("initializes only once per browsing context", () => {
    expect(shouldInitGa4({ enabled: true, alreadyInitialized: false })).toBe(
      true,
    );
    expect(shouldInitGa4({ enabled: true, alreadyInitialized: true })).toBe(
      false,
    );
    expect(shouldInitGa4({ enabled: false, alreadyInitialized: false })).toBe(
      false,
    );
  });

  it("fires one page_view per distinct path", () => {
    expect(
      shouldTrackGa4PageView({
        enabled: true,
        currentPath: "/",
        lastTrackedPath: null,
      }),
    ).toBe(true);

    expect(
      shouldTrackGa4PageView({
        enabled: true,
        currentPath: "/",
        lastTrackedPath: "/",
      }),
    ).toBe(false);

    expect(
      shouldTrackGa4PageView({
        enabled: true,
        currentPath: "/request-a-quote/",
        lastTrackedPath: "/",
      }),
    ).toBe(true);
  });

  it("does not fire page_view when disabled or path empty", () => {
    expect(
      shouldTrackGa4PageView({
        enabled: false,
        currentPath: "/",
        lastTrackedPath: null,
      }),
    ).toBe(false);
    expect(
      shouldTrackGa4PageView({
        enabled: true,
        currentPath: "",
        lastTrackedPath: null,
      }),
    ).toBe(false);
  });

  it("dedupes init+astro:page-load on the same URL", () => {
    const path = "/lawn-fertilization-weed-control/";
    const first = shouldTrackGa4PageView({
      enabled: true,
      currentPath: path,
      lastTrackedPath: undefined,
    });
    const second = shouldTrackGa4PageView({
      enabled: true,
      currentPath: path,
      lastTrackedPath: path,
    });
    expect(first).toBe(true);
    expect(second).toBe(false);
  });
});
