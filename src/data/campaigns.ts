export type CampaignOffer = {
  id: string;
  slug: string;
  title: string;
  headline: string;
  summary: string;
  /** Offer copy for forms / landing — review before publishing */
  offerLabel?: string;
  offerDetail?: string;
  /** ISO date or null when unknown — treat as reviewable/expirable */
  expiresAt: string | null;
  status: "active-review" | "active" | "expired" | "draft";
  thankYouPath?: string;
  leadSourceHint: string;
  notes?: string;
  scrubbedClaims?: string[];
};

/**
 * Campaign / promo landings stay separate from global CTAs.
 * Offers are configurable and must be reviewable for expiration.
 */
export const campaigns: CampaignOffer[] = [
  {
    id: "facebook-50",
    slug: "request-an-estimate-facebook-50",
    title: "Request An Estimate — Facebook 50",
    headline: "Less weeds. More lawn to love.",
    summary:
      "November Facebook estimate landing: 50% off the first lawn treatment, maximum $75 discount.",
    offerLabel: "50% off your first lawn treatment",
    offerDetail: "November special · Save up to $75",
    /** End of November America/Chicago — offer auto-hides after this instant */
    expiresAt: "2026-12-01T06:00:00.000Z",
    status: "active",
    thankYouPath: "/thank-you/",
    /** Exact CRM lead_source / source strings from live Divi module */
    leadSourceHint:
      "Facebook Ad - November 50% Off First Treatment (Up to $75)",
    notes:
      "Divi source saved to form page code.txt. Auto-expires after November 2026 (America/Chicago).",
    scrubbedClaims: [
      "8 treatments per year (confirm before bundling into offer copy)",
      "No long-term contract (confirm terms)",
    ],
  },
  {
    id: "facebook-estimate",
    slug: "facebook-estimate-request",
    title: "Facebook Estimate Request",
    headline: "Less weeds. More lawn to love.",
    summary:
      "Facebook estimate request page; WP copy also references the November 50% / $75 offer.",
    offerLabel: "50% off your first lawn treatment",
    offerDetail: "November special · Save up to $75",
    expiresAt: "2026-12-01T06:00:00.000Z",
    status: "active",
    thankYouPath: "/thank-you/",
    leadSourceHint:
      "Facebook Ad - November 50% Off First Treatment (Up to $75)",
    notes:
      "Shares November offer + Divi form contract with facebook-50. Auto-expires after November 2026.",
    scrubbedClaims: [
      "8 treatments per year (confirm before bundling into offer copy)",
      "No long-term contract (confirm terms)",
    ],
  },
  {
    id: "postcard",
    slug: "post-card-estimate-request",
    title: "Post Card Estimate Request",
    headline: "We just treated your neighbor's lawn.",
    summary:
      "Neighbor / postcard estimate landing with a $25 first-month neighbor offer noted for the team.",
    offerLabel: "$25 neighbor offer",
    offerDetail: "$25 first-month neighbor offer (noted for office follow-up)",
    expiresAt: null,
    status: "active-review",
    leadSourceHint: "postcard",
    notes: "Confirm whether the $25 neighbor offer is still current before featuring prominently.",
  },
  {
    id: "trucklead",
    slug: "trucklead",
    title: "You Saw Our Truck",
    headline: "Saw our truck? Let’s talk about your lawn.",
    summary:
      "Truck-sighting estimate landing for lawn fertilization and weed control across our South Louisiana service areas.",
    expiresAt: null,
    status: "active",
    leadSourceHint: "truck",
    scrubbedClaims: ["No long-term contracts (confirm before emphasizing)"],
  },
  {
    id: "gym",
    slug: "gym-member-lawn-care-special",
    title: "Gym Member Lawn Care Special",
    headline: "Make your lawn look as strong as you feel after the gym.",
    summary:
      "Gym TV / member special — free custom price estimate for weed control and fertilization.",
    expiresAt: null,
    status: "active-review",
    leadSourceHint: "gym",
    notes: "Confirm partner gyms and whether the special is still offered.",
  },
  {
    id: "nextdoor",
    slug: "nextdoor-estimate-request",
    title: "Nextdoor Estimate Request",
    headline: "Start your lawn account for $25",
    summary:
      "Nextdoor neighbor landing: $25 to open your lawn-care account, plus a free local estimate for fertilization and weed control.",
    offerLabel: "$25 to open your account",
    offerDetail: "Nextdoor $25 Account Offer",
    expiresAt: null,
    status: "active",
    thankYouPath: "/thank-you-nextdoor/",
    leadSourceHint: "Nextdoor Ad - $25 Account Offer",
    notes:
      "Owner-confirmed usual Nextdoor neighbor offer. Final pricing still depends on lawn size and selected services.",
    scrubbedClaims: [
      "Customer quote on WP page — do not invent additional testimonials; verify before reusing",
      "8 scheduled treatments per year",
      "No long-term contracts",
    ],
  },
];

export const campaignBySlug = Object.fromEntries(
  campaigns.map((c) => [c.slug, c]),
) as Record<string, CampaignOffer>;

/** Campaigns that need owner review before being treated as currently live offers. */
export const campaignsNeedingReview = campaigns.filter(
  (c) => c.status === "active-review" || (c.expiresAt === null && Boolean(c.offerLabel)),
);
