import { describe, expect, it } from "vitest";
import {
  isConfirmedWebsiteLeadAcceptance,
  isMarketingConsentGranted,
  isMetaPixelEnabled,
  normalizeBrowserEventId,
  normalizeMetaPixelId,
  shouldFireMetaLead,
  shouldInitMetaPixel,
  shouldTrackMetaPageView,
} from "../src/lib/analytics/metaPixel";

const PROD_PIXEL_ID = "1014961828315598";
const EVENT_ID = "lead_abc-123-uuid";

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

describe("website lead acceptance contract", () => {
  it("accepts only confirmed quote responses with customer_id", () => {
    expect(
      isConfirmedWebsiteLeadAcceptance(
        { ok: true, customer_id: "cust-1" },
        true,
      ),
    ).toBe(true);
    expect(
      isConfirmedWebsiteLeadAcceptance(
        { ok: true, customer_id: 42 },
        true,
      ),
    ).toBe(true);
  });

  it("rejects failed submissions, bare 2xx, honeypot soft-success, and missing ids", () => {
    expect(
      isConfirmedWebsiteLeadAcceptance(
        { ok: false, message: "nope" },
        true,
      ),
    ).toBe(false);
    expect(
      isConfirmedWebsiteLeadAcceptance(
        { ok: true, customer_id: "x" },
        false,
      ),
    ).toBe(false);
    expect(isConfirmedWebsiteLeadAcceptance({}, true)).toBe(false);
    expect(
      isConfirmedWebsiteLeadAcceptance(
        { ok: true, customer_id: null, ignored: true },
        true,
      ),
    ).toBe(false);
    expect(
      isConfirmedWebsiteLeadAcceptance(
        { ok: true, customer_id: null },
        true,
      ),
    ).toBe(false);
    expect(
      isConfirmedWebsiteLeadAcceptance(
        { ok: true, customer_id: "" },
        true,
      ),
    ).toBe(false);
    expect(isConfirmedWebsiteLeadAcceptance(null, true)).toBe(false);
  });
});

describe("Meta Lead fire gates", () => {
  const base = {
    accepted: true,
    mocked: false,
    browserEventId: EVENT_ID,
    marketingConsent: undefined as boolean | undefined,
    pixelAvailable: true,
    alreadyFiredForEventId: false,
  };

  it("fires Lead after successful non-mock acceptance with shared event id", () => {
    expect(shouldFireMetaLead(base)).toBe(true);
    expect(normalizeBrowserEventId(EVENT_ID)).toBe(EVENT_ID);
  });

  it("does not fire Lead on failed or unconfirmed acceptance", () => {
    expect(shouldFireMetaLead({ ...base, accepted: false })).toBe(false);
  });

  it("does not fire Lead for mock CRM acceptance", () => {
    expect(shouldFireMetaLead({ ...base, mocked: true })).toBe(false);
  });

  it("suppresses duplicate Lead for the same browser_event_id", () => {
    expect(
      shouldFireMetaLead({ ...base, alreadyFiredForEventId: true }),
    ).toBe(false);
  });

  it("respects consent deny and unavailable Pixel (env gating)", () => {
    expect(
      shouldFireMetaLead({ ...base, marketingConsent: false }),
    ).toBe(false);
    expect(shouldFireMetaLead({ ...base, pixelAvailable: false })).toBe(false);
  });

  it("requires a usable browser_event_id shared with CRM", () => {
    expect(shouldFireMetaLead({ ...base, browserEventId: "" })).toBe(false);
    expect(shouldFireMetaLead({ ...base, browserEventId: "   " })).toBe(false);
    expect(normalizeBrowserEventId("  lead_shared  ")).toBe("lead_shared");
  });
});
