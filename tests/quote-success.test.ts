import { describe, expect, it } from "vitest";
import {
  isConfirmedWebsiteLeadAcceptance,
  shouldFireMetaLead,
} from "../src/lib/analytics/metaPixel";
import {
  QUOTE_SUCCESS_HEADING,
  QUOTE_SUCCESS_MESSAGE,
  RETIRED_THANK_YOU_PATHS,
  THANK_YOU_REDIRECT_TARGET,
  buildQuoteSuccessCopy,
  isRetiredThankYouPath,
  planQuoteSuccessActions,
} from "../src/lib/quotes/successPresentation";

const EVENT_ID = "quote-event-abc-123";

describe("inline quote success copy", () => {
  it("uses the required thank-you heading and message", () => {
    const copy = buildQuoteSuccessCopy();
    expect(copy.heading).toBe("Thank you!");
    expect(copy.heading).toBe(QUOTE_SUCCESS_HEADING);
    expect(copy.message).toBe(
      "We've received your estimate request! Our local team will contact you within one business day.",
    );
    expect(copy.message).toBe(QUOTE_SUCCESS_MESSAGE);
  });

  it("preserves promotional offer confirmation when provided", () => {
    const copy = buildQuoteSuccessCopy({
      offerConfirm: "  $25 to open your account.  Limited neighbor offer. ",
    });
    expect(copy.offerConfirm).toBe(
      "$25 to open your account. Limited neighbor offer.",
    );
  });
});

describe("success vs failure presentation", () => {
  it("shows inline success and never navigates to thank-you after acceptance", () => {
    const plan = planQuoteSuccessActions({
      accepted: true,
      browserEventId: EVENT_ID,
      mocked: false,
      legacyThankYouPath: "/thank-you/",
      offerConfirm: "November offer: 50% off first treatment",
    });

    expect(plan.showInlineSuccess).toBe(true);
    expect(plan.keepFormVisible).toBe(false);
    expect(plan.navigateTo).toBeNull();
    expect(plan.browserEventId).toBe(EVENT_ID);
    expect(plan.copy.heading).toBe(QUOTE_SUCCESS_HEADING);
    expect(plan.copy.message).toBe(QUOTE_SUCCESS_MESSAGE);
    expect(plan.copy.offerConfirm).toContain("50% off");
  });

  it("keeps the form visible on failed submission (retry path)", () => {
    const plan = planQuoteSuccessActions({
      accepted: false,
      browserEventId: EVENT_ID,
      legacyThankYouPath: "/thank-you/",
    });

    expect(plan.showInlineSuccess).toBe(false);
    expect(plan.keepFormVisible).toBe(true);
    expect(plan.navigateTo).toBeNull();
    expect(plan.shouldAttemptMetaLead).toBe(false);
  });
});

describe("Lead event after inline success", () => {
  it("attempts one Lead with the shared browser_event_id as eventID", () => {
    const response = { ok: true as const, customer_id: "cust-9", mocked: false };
    const accepted = isConfirmedWebsiteLeadAcceptance(response, true);
    const plan = planQuoteSuccessActions({
      accepted,
      browserEventId: EVENT_ID,
      mocked: false,
    });

    expect(plan.showInlineSuccess).toBe(true);
    expect(plan.navigateTo).toBeNull();
    expect(plan.shouldAttemptMetaLead).toBe(true);
    expect(
      shouldFireMetaLead({
        accepted,
        mocked: false,
        browserEventId: plan.browserEventId,
        pixelAvailable: true,
        alreadyFiredForEventId: false,
      }),
    ).toBe(true);

    // Duplicate suppression for the same event ID
    expect(
      shouldFireMetaLead({
        accepted,
        mocked: false,
        browserEventId: plan.browserEventId,
        pixelAvailable: true,
        alreadyFiredForEventId: true,
      }),
    ).toBe(false);
  });

  it("does not attempt Lead when acceptance fails", () => {
    const response = { ok: true as const, customer_id: null };
    const accepted = isConfirmedWebsiteLeadAcceptance(response, true);
    const plan = planQuoteSuccessActions({
      accepted,
      browserEventId: EVENT_ID,
    });
    expect(accepted).toBe(false);
    expect(plan.shouldAttemptMetaLead).toBe(false);
    expect(plan.keepFormVisible).toBe(true);
  });
});

describe("retired thank-you routes", () => {
  it("lists thank-you variants for homepage redirect", () => {
    expect(RETIRED_THANK_YOU_PATHS).toContain("/thank-you/");
    expect(RETIRED_THANK_YOU_PATHS).toContain("/thank-you-nextdoor/");
    expect(RETIRED_THANK_YOU_PATHS).toContain("/thank-you-core-aeration/");
    expect(THANK_YOU_REDIRECT_TARGET).toBe("/");
    expect(isRetiredThankYouPath("/thank-you")).toBe(true);
    expect(isRetiredThankYouPath("/thank-you/")).toBe(true);
    expect(isRetiredThankYouPath("/request-a-quote/")).toBe(false);
  });
});
