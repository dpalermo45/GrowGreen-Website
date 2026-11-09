export type Offer25Key = "nextdoor" | "postcard" | "trucklead";

export type Offer25LandingCopy = {
  key: Offer25Key;
  ariaLabel: string;
  dataAttr: string;
  formSource: string;
  leadSourceFallback: string;
  promotionFallback: string;
  thankYouFallback: string;
  heroMedia: "lawn" | "truck-and-trailer" | "f250-side-view";
  bandImage: "truck-and-trailer" | "lawn";
  toplineChannel: string;
  toplineOffer: string;
  eyebrow: string;
  appendCoverageToEyebrow: boolean;
  h1Active: {
    before: string;
    emphasis: string;
    after?: string;
    emphasisPrefix?: string;
    breakBeforeEmphasis?: boolean;
  };
  h1Inactive: {
    before: string;
    emphasis: string;
    after?: string;
    emphasisPrefix?: string;
    breakBeforeEmphasis?: boolean;
  };
  leadActive: string;
  leadInactive: string;
  ctaPrimaryActive: string;
  offerBannerTitle: string;
  offerBannerBody: string;
  formHeadingActive: string;
  formSubActive: string;
  stepsTitleActive: string;
  step3TitleActive: string;
  step3BodyActive: string;
  localEyebrow: string;
  bandEyebrow: string;
  bandTitle: string;
  bandBody: string;
  bandCtaActive: string;
  faqOfferSummary: string;
  faqOfferBody: string;
  faqSubmitBody: string;
  closeTitleActive: string;
};

export const offer25Landings: Record<Offer25Key, Offer25LandingCopy> = {
  nextdoor: {
    key: "nextdoor",
    ariaLabel: "Nextdoor lawn estimate offer",
    dataAttr: "data-nextdoor-landing",
    formSource: "nextdoor-estimate-request",
    leadSourceFallback: "Nextdoor Ad - $25 Account Offer",
    promotionFallback: "Nextdoor $25 Account Offer",
    thankYouFallback: "/thank-you-nextdoor/",
    heroMedia: "lawn",
    bandImage: "truck-and-trailer",
    toplineChannel: "Nextdoor neighbor offer",
    toplineOffer: "$25 to open your account",
    eyebrow: "From your Nextdoor neighbors",
    appendCoverageToEyebrow: true,
    h1Active: {
      before: "Start your lawn account",
      emphasis: "$25",
      emphasisPrefix: "for ",
      breakBeforeEmphasis: true,
    },
    h1Inactive: {
      before: "A healthier lawn from",
      emphasis: "local",
      emphasisPrefix: "a ",
      after: " team",
      breakBeforeEmphasis: true,
    },
    leadActive:
      "Professional fertilization and weed control for South Louisiana. Request a free estimate — we’ll note your Nextdoor $25 account offer when our office follows up.",
    leadInactive:
      "Professional fertilization and weed control for South Louisiana. Request a free estimate from your local, firefighter-owned team.",
    ctaPrimaryActive: "Claim the $25 offer",
    offerBannerTitle: "Nextdoor account offer",
    offerBannerBody: "Noted for office follow-up with your estimate",
    formHeadingActive: "Get your free estimate",
    formSubActive:
      "Enter the lawn address. We’ll prepare pricing and note the $25 Nextdoor account offer for our team.",
    stepsTitleActive: "How the neighbor offer works",
    step3TitleActive: "Start with the $25 account offer",
    step3BodyActive:
      "Your Nextdoor neighbor offer is noted for follow-up. Final plan pricing still depends on lawn size and services.",
    localEyebrow: "Why neighbors switch",
    bandEyebrow: "On neighborhood routes",
    bandTitle: "You’ll see our truck — and you’ll know who to call.",
    bandBody:
      "We’re out treating lawns near you. When you’re ready for fertilization and weed control, this estimate request goes straight to our St. Amant office.",
    bandCtaActive: "Claim the $25 neighbor offer",
    faqOfferSummary: "What is the $25 account offer?",
    faqOfferBody:
      "For Nextdoor neighbors, we typically open a new lawn-care account for $25. Mention this page when we follow up. Final monthly pricing still depends on lawn size and the services you choose.",
    faqSubmitBody:
      "Your request goes to the Grow Green office as a Nextdoor lead. A team member reviews it and contacts you about the estimate — no obligation to enroll.",
    closeTitleActive: "Claim the Nextdoor $25 account offer",
  },
  postcard: {
    key: "postcard",
    ariaLabel: "Postcard lawn estimate offer",
    dataAttr: "data-postcard-landing",
    formSource: "post-card-estimate-request",
    leadSourceFallback: "Postcard - $25 Neighbor Offer",
    promotionFallback: "Postcard $25 Neighbor Offer",
    thankYouFallback: "/thank-you/",
    heroMedia: "lawn",
    bandImage: "truck-and-trailer",
    toplineChannel: "Neighborhood postcard offer",
    toplineOffer: "$25 off your first month",
    eyebrow: "Exclusive neighborhood offer",
    appendCoverageToEyebrow: true,
    h1Active: {
      before: "We just treated",
      emphasis: "your neighbor’s lawn",
      breakBeforeEmphasis: true,
    },
    h1Inactive: {
      before: "A healthier lawn from",
      emphasis: "local",
      after: " team",
      breakBeforeEmphasis: true,
    },
    leadActive:
      "Your lawn could be next. Request a free estimate for fertilization and weed control — we’ll note your $25 first-month neighbor offer when our office follows up.",
    leadInactive:
      "Request a free estimate for fertilization and weed control from your local, firefighter-owned team already working in your neighborhood.",
    ctaPrimaryActive: "Claim the $25 neighbor offer",
    offerBannerTitle: "Neighbor postcard offer",
    offerBannerBody: "$25 off first month · Noted for office follow-up",
    formHeadingActive: "Claim your neighbor offer",
    formSubActive:
      "Enter the lawn address. We’ll prepare pricing and note the $25 first-month neighbor offer for our team.",
    stepsTitleActive: "How the postcard offer works",
    step3TitleActive: "Start with the $25 neighbor offer",
    step3BodyActive:
      "Your postcard neighbor offer is noted for follow-up when you start an eligible recurring lawn treatment program. Final plan pricing still depends on lawn size and services.",
    localEyebrow: "Why neighbors switch",
    bandEyebrow: "Already in your neighborhood",
    bandTitle: "We’re treating lawns near you.",
    bandBody:
      "This postcard lands because our routes are local. When you’re ready for fertilization and weed control, this estimate request goes straight to our St. Amant office.",
    bandCtaActive: "Claim the $25 neighbor offer",
    faqOfferSummary: "What is the $25 neighbor offer?",
    faqOfferBody:
      "For neighbors who received our postcard, we typically take $25 off the first month when you start an eligible recurring lawn treatment program. Mention this page when we follow up. Final monthly pricing still depends on lawn size and the services you choose.",
    faqSubmitBody:
      "Your request goes to the Grow Green office as a postcard lead. A team member reviews it and contacts you about the estimate — no obligation to enroll.",
    closeTitleActive: "Claim the postcard $25 neighbor offer",
  },
  trucklead: {
    key: "trucklead",
    ariaLabel: "Truck QR lawn estimate offer",
    dataAttr: "data-trucklead-landing",
    formSource: "trucklead",
    leadSourceFallback: "Truck QR",
    promotionFallback: "Truck QR $25 Account Offer",
    thankYouFallback: "/thank-you/",
    heroMedia: "f250-side-view",
    bandImage: "truck-and-trailer",
    toplineChannel: "You saw our truck",
    toplineOffer: "$25 to open your account",
    eyebrow: "Grow Green Weed Control · Truck QR",
    appendCoverageToEyebrow: false,
    h1Active: {
      before: "Saw our truck?",
      emphasis: "$25",
      emphasisPrefix: "Start your lawn account for ",
      breakBeforeEmphasis: true,
    },
    h1Inactive: {
      before: "Saw our truck?",
      emphasis: "your lawn",
      emphasisPrefix: "Let’s talk about ",
      breakBeforeEmphasis: true,
    },
    leadActive:
      "A healthier, better-looking lawn could be your next stop. Request a free estimate — we’ll note your truck $25 account offer when our office follows up.",
    leadInactive:
      "A healthier, better-looking lawn could be your next stop. Get local, firefighter-owned lawn care with a plan built around your yard.",
    ctaPrimaryActive: "Claim the $25 truck offer",
    offerBannerTitle: "Truck QR account offer",
    offerBannerBody: "$25 to open your account · Noted for follow-up",
    formHeadingActive: "Get your free estimate",
    formSubActive:
      "Enter the lawn address. We’ll prepare pricing and note the $25 truck account offer for our team.",
    stepsTitleActive: "How the truck offer works",
    step3TitleActive: "Start with the $25 account offer",
    step3BodyActive:
      "Your truck QR offer is noted for follow-up. Final plan pricing still depends on lawn size and services.",
    localEyebrow: "Why homeowners call after seeing our truck",
    bandEyebrow: "Local routes. Real results.",
    bandTitle: "Lawn care built for South Louisiana yards.",
    bandBody:
      "Seasonal timing for our heat and humidity, clear visit notes, and a St. Amant office you can actually reach — not a national call center.",
    bandCtaActive: "Claim the $25 truck offer",
    faqOfferSummary: "What is the $25 truck offer?",
    faqOfferBody:
      "When you scan our truck QR, we typically open a new lawn-care account for $25. Mention this page when we follow up. Final monthly pricing still depends on lawn size and the services you choose.",
    faqSubmitBody:
      "Your request goes to the Grow Green office as a Truck QR lead. A team member reviews it and contacts you about the estimate — no obligation to enroll.",
    closeTitleActive: "Claim the truck $25 account offer",
  },
};
