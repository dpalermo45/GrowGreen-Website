/**
 * Shared quote-form success presentation (inline confirmation; no thank-you redirect).
 */

export const QUOTE_SUCCESS_HEADING = "Thank you!";

export const QUOTE_SUCCESS_MESSAGE =
  "We've received your estimate request! Our local team will contact you within one business day.";

export const QUOTE_SUCCESS_MOCK_NOTE =
  "Request accepted in mock mode (no live CRM). Configure CRM credentials for production delivery.";

/** Retired standalone thank-you URLs — keep resolving via homepage redirect. */
export const RETIRED_THANK_YOU_PATHS = [
  "/thank-you/",
  "/thank-you-nextdoor/",
  "/thank-you-core-aeration/",
] as const;

export const THANK_YOU_REDIRECT_TARGET = "/";

export function normalizeOfferConfirm(raw: string | undefined | null): string {
  return String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildQuoteSuccessCopy(opts?: {
  offerConfirm?: string | null;
  mocked?: boolean;
}): {
  heading: string;
  message: string;
  offerConfirm: string;
  mockNote: string;
} {
  return {
    heading: QUOTE_SUCCESS_HEADING,
    message: QUOTE_SUCCESS_MESSAGE,
    offerConfirm: normalizeOfferConfirm(opts?.offerConfirm),
    mockNote: opts?.mocked ? QUOTE_SUCCESS_MOCK_NOTE : "",
  };
}

/**
 * Post-acceptance UX + Lead plan for quote forms.
 * Lead still requires the shared Meta helper gates; this only encodes presentation intent.
 */
export function planQuoteSuccessActions(opts: {
  accepted: boolean;
  browserEventId: string;
  mocked?: boolean;
  /** Remaining promotional confirmation line (optional). */
  offerConfirm?: string | null;
  /** Legacy thank-you path props must never navigate. */
  legacyThankYouPath?: string | null;
}): {
  showInlineSuccess: boolean;
  navigateTo: string | null;
  keepFormVisible: boolean;
  browserEventId: string;
  shouldAttemptMetaLead: boolean;
  copy: ReturnType<typeof buildQuoteSuccessCopy>;
} {
  const browserEventId = String(opts.browserEventId || "").trim();
  if (!opts.accepted) {
    return {
      showInlineSuccess: false,
      navigateTo: null,
      keepFormVisible: true,
      browserEventId,
      shouldAttemptMetaLead: false,
      copy: buildQuoteSuccessCopy({
        offerConfirm: opts.offerConfirm,
        mocked: opts.mocked,
      }),
    };
  }

  return {
    showInlineSuccess: true,
    navigateTo: null,
    keepFormVisible: false,
    browserEventId,
    shouldAttemptMetaLead: opts.mocked !== true && Boolean(browserEventId),
    copy: buildQuoteSuccessCopy({
      offerConfirm: opts.offerConfirm,
      mocked: opts.mocked,
    }),
  };
}

export function isRetiredThankYouPath(path: string): boolean {
  const normalized = path.endsWith("/") ? path : `${path}/`;
  return (RETIRED_THANK_YOU_PATHS as readonly string[]).includes(normalized);
}
