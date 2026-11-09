export const site = {
  name: "Grow Green Weed Control",
  shortName: "Grow Green",
  tagline: "Lawn fertilization & weed control for South Louisiana",
  phone: "(225) 461-3199",
  phoneTel: "+12254613199",
  email: "office@growgreenweedcontrol.com",
  hours: {
    label: "Monday–Friday, 8 AM–4 PM",
    timezone: "America/Chicago",
    weekdays: "Monday–Friday",
    open: "08:00",
    close: "16:00",
  },
  address: {
    street: "14464 L Keller Rd",
    city: "St. Amant",
    state: "LA",
    zip: "70774",
    full: "14464 L Keller Rd, St. Amant, LA 70774",
  },
  startingPrice: {
    amount: 39,
    period: "month",
    service: "Lawn fertilization and weed control",
    /** Customer-facing line used near prices on public pages */
    short:
      "Plans start at $39/month. Your estimate depends on lawn size and selected services.",
    disclaimer:
      "Plans start at $39/month. Your estimate depends on lawn size and selected services.",
  },
  identity: [
    "Locally owned and operated",
    "Family-owned",
    "Firefighter-owned",
  ],
  social: {
    facebook: "https://www.facebook.com/growgreenweedcontrol",
    instagram: "https://www.instagram.com/growgreenweedcontrolla/",
    nextdoor: "https://nextdoor.com/page/grow-green-weed-control-st-amant-la/",
    youtube: "https://www.youtube.com/@growgreenweedcontrol4319",
    google: "https://share.google/kswC3aN1uIXDHrvAc",
  },
  portalUrl: "https://portal.growgreenweedcontrol.com/portal/",
  defaultOgImage: "/images/hero/lawn-hero.jpg",
} as const;

/** Claims present in legacy WP/screenshots — do not publish until verified. */
export const claimsNeedingVerification = [
  {
    claim: "600+ local lawns served",
    sources: ["homepage WP", "services WP", "design screenshot"],
    status: "omit-until-verified",
  },
  {
    claim: "4.9-star Google rating",
    sources: ["about WP", "services WP", "design screenshot"],
    status: "omit-until-verified",
  },
  {
    claim: "Satisfaction guaranteed / service guarantee wording",
    sources: ["lawn fertilization WP"],
    status: "omit-until-verified",
  },
  {
    claim: "No long-term contracts / month-to-month",
    sources: ["homepage WP", "about WP"],
    status: "softened on live pages to “billing options / terms in estimate”; confirm exact contract language before stronger claims",
  },
  {
    claim: "8 treatments per year",
    sources: ["homepage how-it-works", "lawn program WP"],
    status: "softened on live marketing to seasonal/visit-spacing language; confirm exact visit count before restoring “8” claims",
  },
  {
    claim: "Most quotes returned within 24 hours",
    sources: ["homepage Divi quote banner"],
    status: "omit-until-verified — replaced on Astro homepage with factual estimate CTA",
  },
] as const;
