import { describe, expect, it } from "vitest";
import {
  isMarketingConsentGranted,
  isMetaPixelEnabled,
  normalizeMetaPixelId,
  shouldInitMetaPixel,
  shouldTrackMetaPageView,
} from "../src/lib/analytics/metaPixel";

const PROD_PIXEL_ID = "1014961828315598";

describe("normalizeMetaPixelId", () => {
  it("accepts the production Pixel ID", () => {
    expect(normalizeMetaPixelId(PROD_PIXEL_ID)).toBe(PROD_PIXEL_ID);
  });

  it("rejects empty, whitespace, and non-digit IDs (local/preview gating)", () => {
    expect(normalizeMetaPixelId("")).toBe("");
    expect(normalizeMetaPixelId("   ")).toBe("");
    expect(normalizeMetaPixelId(undefined)).toBe("");
    expect(normalizeMetaPixelId(null)).toBe("");
    expect(normalizeMetaPixelId("not-a-pixel")).toBe("");
    expect(normalizeMetaPixelId("GTM-XXXX")).toBe("");
  });
});

describe("consent + enablement", () => {
  it("treats unset consent as granted (no CMP default deny)", () => {
    expect(isMarketingConsentGranted(undefined)).toBe(true);
    expect(isMarketingConsentGranted(null)).toBe(true);
    expect(isMarketingConsentGranted(true)).toBe(true);
    expect(isMarketingConsentGranted(false)).toBe(false);
  });

  it("disables Pixel when PUBLIC_META_PIXEL_ID is unset", () => {
    expect(isMetaPixelEnabled({ pixelId: "" })).toBe(false);
    expect(isMetaPixelEnabled({ pixelId: undefined })).toBe(false);
  });

  it("enables Pixel for a valid ID when consent is not denied", () => {
    expect(isMetaPixelEnabled({ pixelId: PROD_PIXEL_ID })).toBe(true);
    expect(
      isMetaPixelEnabled({ pixelId: PROD_PIXEL_ID, marketingConsent: true }),
    ).toBe(true);
  });

  it("blocks Pixel when marketing consent is explicitly false", () => {
    expect(
      isMetaPixelEnabled({
        pixelId: PROD_PIXEL_ID,
        marketingConsent: false,
      }),
    ).toBe(false);
  });
});

describe("duplicate init / PageView guards", () => {
  it("initializes only once per browsing context", () => {
    expect(
      shouldInitMetaPixel({ enabled: true, alreadyInitialized: false }),
    ).toBe(true);
    expect(
      shouldInitMetaPixel({ enabled: true, alreadyInitialized: true }),
    ).toBe(false);
    expect(
      shouldInitMetaPixel({ enabled: false, alreadyInitialized: false }),
    ).toBe(false);
  });

  it("fires one PageView per distinct path", () => {
    expect(
      shouldTrackMetaPageView({
        enabled: true,
        currentPath: "/",
        lastTrackedPath: null,
      }),
    ).toBe(true);

    expect(
      shouldTrackMetaPageView({
        enabled: true,
        currentPath: "/",
        lastTrackedPath: "/",
      }),
    ).toBe(false);

    expect(
      shouldTrackMetaPageView({
        enabled: true,
        currentPath: "/request-a-quote/",
        lastTrackedPath: "/",
      }),
    ).toBe(true);
  });

  it("does not fire PageView when disabled or path empty", () => {
    expect(
      shouldTrackMetaPageView({
        enabled: false,
        currentPath: "/",
        lastTrackedPath: null,
      }),
    ).toBe(false);
    expect(
      shouldTrackMetaPageView({
        enabled: true,
        currentPath: "",
        lastTrackedPath: null,
      }),
    ).toBe(false);
  });

  it("dedupes init+astro:page-load on the same URL", () => {
    const path = "/lawn-fertilization-weed-control/";
    const first = shouldTrackMetaPageView({
      enabled: true,
      currentPath: path,
      lastTrackedPath: undefined,
    });
    const second = shouldTrackMetaPageView({
      enabled: true,
      currentPath: path,
      lastTrackedPath: path,
    });
    expect(first).toBe(true);
    expect(second).toBe(false);
  });
});
