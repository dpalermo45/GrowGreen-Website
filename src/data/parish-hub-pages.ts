import type { GeoPage } from "./geo-pages.generated";
import { serviceAreas } from "./service-areas";

export type ParishHubDefinition = {
  parishKey: string;
  slug: string;
  path: string;
  /** Short corridor label for region field */
  region: string;
  seoTitle: string;
  seoDesc: string;
  intro: string;
  bodyParas: string[];
};

function communityNames(parishKey: string): string[] {
  return serviceAreas
    .filter((a) => a.parish === parishKey)
    .map((a) => a.name)
    .sort((a, b) => a.localeCompare(b));
}

function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/**
 * New parish hub landings for served parishes that did not have a retained WP hub URL.
 * Existing Ascension / Livingston / West Baton Rouge / Iberville hubs stay in geo-pages.generated.
 */
export const additionalParishHubs: ParishHubDefinition[] = [
  {
    parishKey: "East Baton Rouge",
    slug: "lawn-treatments-east-baton-rouge-parish",
    path: "/lawn-treatments-east-baton-rouge-parish/",
    region: "Greater Baton Rouge",
    seoTitle: "Lawn Treatments in East Baton Rouge Parish, LA | Grow Green",
    seoDesc:
      "Lawn fertilization and weed control across East Baton Rouge Parish—including Baton Rouge, Central, Zachary, St. George, and Baker. Plans start at $39/month.",
    intro:
      "East Baton Rouge Parish lawns deal with heat, humidity, shade from mature oaks, and heavy warm-season weed pressure. Grow Green builds fertilization and weed-control plans for St. Augustine, centipede, zoysia, and bermuda—not a generic national calendar.",
    bodyParas: [
      `Communities we serve in East Baton Rouge Parish include ${formatList(communityNames("East Baton Rouge"))}.`,
      "Urban and suburban yards here often mix sunny front lawns with shaded side yards. We size the treatable area, note grass type, and explain a clear monthly price before you approve service.",
      "Add-ons such as fire ant control, flower-bed weed control, aeration, and outdoor pest treatments stay optional—selected only when the property needs them.",
    ],
  },
  {
    parishKey: "Jefferson",
    slug: "lawn-treatments-jefferson-parish",
    path: "/lawn-treatments-jefferson-parish/",
    region: "Metro New Orleans",
    seoTitle: "Lawn Treatments in Jefferson Parish, LA | Grow Green Weed Control",
    seoDesc:
      "Professional lawn fertilization and weed control for Metairie, Kenner, and Jefferson Parish properties. Local South Louisiana team. Free estimates.",
    intro:
      "Jefferson Parish turf faces Gulf humidity, compacted clay soils, and year-round weed pressure in Metairie and Kenner neighborhoods. Grow Green brings the same season-smart liquid program used across our South Louisiana coverage area.",
    bodyParas: [
      `Confirmed Jefferson Parish communities include ${formatList(communityNames("Jefferson"))}. Send any service address so we can confirm coverage.`,
      "Metro lots can be smaller with irrigation, flower beds, and high foot traffic. We measure treatable turf and keep the recommendation practical for the space you actually maintain.",
      "We do not advertise mowing. Our focus is fertilization, weed control, and related outdoor treatments timed for warm-season grass.",
    ],
  },
  {
    parishKey: "St. James",
    slug: "lawn-treatments-st-james-parish",
    path: "/lawn-treatments-st-james-parish/",
    region: "River Parishes",
    seoTitle: "Lawn Treatments in St. James Parish, LA | Grow Green Weed Control",
    seoDesc:
      "Lawn fertilization and weed control in St. James Parish communities including Lutcher, Gramercy, Paulina, and Convent. Firefighter-owned. Free estimates.",
    intro:
      "St. James Parish sits along the River Parishes corridor, where warm-season lawns face long growing seasons, river-parish humidity, and stubborn grassy and broadleaf weeds. Local timing matters more than a one-size spray route.",
    bodyParas: [
      `We accept customers in ${formatList(communityNames("St. James"))}.`,
      "River Parish properties range from compact town lots to larger yards with mixed sun and shade. Your estimate is based on measured treatable lawn area and the services you select.",
      "From our St. Amant office, the same local team handles estimates, scheduling questions, and follow-up during Monday–Friday business hours.",
    ],
  },
  {
    parishKey: "St. John the Baptist",
    slug: "lawn-treatments-st-john-the-baptist-parish",
    path: "/lawn-treatments-st-john-the-baptist-parish/",
    region: "River Parishes",
    seoTitle: "Lawn Treatments in St. John the Baptist Parish, LA | Grow Green",
    seoDesc:
      "Lawn fertilization and weed control for LaPlace and St. John the Baptist Parish. Season-smart programs for warm-season turf. Free local estimates.",
    intro:
      "St. John the Baptist Parish lawns—especially around LaPlace—deal with heat, humidity, and aggressive weeds that keep returning without a seasonal plan. Grow Green focuses on fertilization and weed control for warm-season turf.",
    bodyParas: [
      `Confirmed coverage in this parish includes ${formatList(communityNames("St. John the Baptist"))}.`,
      "Share the service address so we can confirm the property falls inside our accepted coverage and prepare accurate pricing for the treatable lawn area.",
      "Plans start at $39/month as a starting price. Final pricing depends on lawn size and selected services—not a one-click quote invented online.",
    ],
  },
  {
    parishKey: "St. Tammany",
    slug: "lawn-treatments-st-tammany-parish",
    path: "/lawn-treatments-st-tammany-parish/",
    region: "Northshore",
    seoTitle: "Lawn Treatments in St. Tammany Parish, LA | Grow Green Weed Control",
    seoDesc:
      "Northshore lawn fertilization and weed control for Covington, Mandeville, Madisonville, and St. Tammany Parish. Local team. Free estimates.",
    intro:
      "St. Tammany Parish Northshore lawns see pine shade, sandy pockets, and humid summers that push weeds hard. Grow Green builds season-smart fertilization and weed-control programs for the warm-season grasses common across Covington, Mandeville, and Madisonville.",
    bodyParas: [
      `Communities we serve include ${formatList(communityNames("St. Tammany"))}.`,
      "Northshore yards often mix turf with tree shade and ornamental beds. We treat the lawn program separately from optional bed or tree-and-shrub care so you only add what the property needs.",
      "Coverage is confirmed from your service address. Nearby addresses outside the listed towns can still be reviewed during the estimate process.",
    ],
  },
  {
    parishKey: "Tangipahoa",
    slug: "lawn-treatments-tangipahoa-parish",
    path: "/lawn-treatments-tangipahoa-parish/",
    region: "Florida Parishes",
    seoTitle: "Lawn Treatments in Tangipahoa Parish, LA | Grow Green Weed Control",
    seoDesc:
      "Lawn fertilization and weed control in Hammond, Ponchatoula, and Tangipahoa Parish. Firefighter-owned South Louisiana team. Free estimates.",
    intro:
      "Tangipahoa Parish lawns around Hammond and Ponchatoula face Florida Parishes humidity, heavy summer growth, and weeds that rebound without consistent prevention. Grow Green times liquid nutrition and weed control for warm-season turf.",
    bodyParas: [
      `Confirmed Tangipahoa Parish communities include ${formatList(communityNames("Tangipahoa"))}.`,
      "Whether the lawn is a compact neighborhood yard or a wider lot, we measure treatable turf and explain the recommended program before you approve anything.",
      "Call or text (225) 461-3199 Monday–Friday, 8 AM–4 PM, or request an estimate online—your information goes to the Grow Green office in St. Amant.",
    ],
  },
];

export function additionalParishHubsAsGeoPages(): GeoPage[] {
  return additionalParishHubs.map((hub) => {
    const cities = communityNames(hub.parishKey);
    return {
      slug: hub.slug,
      path: hub.path,
      title: `Lawn Treatments ${hub.parishKey} Parish`,
      seoTitle: hub.seoTitle,
      seoDesc: hub.seoDesc,
      cityName: `${hub.parishKey} Parish`,
      parish: hub.parishKey,
      region: hub.region,
      focus: "parish",
      intro: hub.intro,
      focusBlurb:
        "This parish hub connects nearby cities we already serve with the same local office, phone number, and estimate process.",
      nearby: cities.slice(0, 5),
      bodyParas: hub.bodyParas,
      headings: [
        `Lawn treatments in ${hub.parishKey} Parish, LA`,
        "Season-smart care for warm-season turf",
        "Get your free lawn estimate",
      ],
    } satisfies GeoPage;
  });
}

export const additionalParishHubBySlug = Object.fromEntries(
  additionalParishHubsAsGeoPages().map((g) => [g.slug, g]),
) as Record<string, GeoPage>;
