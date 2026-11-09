export type ServiceArea = {
  name: string;
  slug: string;
  /** Existing WP URL path when a dedicated page already existed */
  existingUrl?: string;
  /** Louisiana parish name without the word "Parish" */
  parish: string;
  /** Marketing corridor label for heroes and nearby clustering */
  region: string;
  /** Additional retained WP URLs that also cover this place */
  relatedUrls?: string[];
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/'/g, "")
    .replace(/\s+/g, "-");
}

/**
 * All 40 accepted service locations from source inventory.
 * Parish / region values are standard Louisiana geography (not invented customer claims).
 */
export const serviceAreas: ServiceArea[] = [
  {
    name: "St. Amant",
    slug: "st-amant",
    parish: "Ascension",
    region: "Greater Baton Rouge",
  },
  {
    name: "Prairieville",
    slug: "prairieville",
    existingUrl: "/lawn-treatment-service-prairieville-la/",
    parish: "Ascension",
    region: "Greater Baton Rouge",
    relatedUrls: ["/lawn-fertilization-prairieville/"],
  },
  {
    name: "Gonzales",
    slug: "gonzales",
    existingUrl: "/lawn-treatment-service-in-gonzales-la/",
    parish: "Ascension",
    region: "Greater Baton Rouge",
    relatedUrls: ["/lawn-fertilization-gonzales/"],
  },
  {
    name: "Geismar",
    slug: "geismar",
    parish: "Ascension",
    region: "Greater Baton Rouge",
  },
  {
    name: "Dutchtown",
    slug: "dutchtown",
    parish: "Ascension",
    region: "Greater Baton Rouge",
  },
  {
    name: "Sorrento",
    slug: "sorrento",
    parish: "Ascension",
    region: "Greater Baton Rouge",
  },
  {
    name: "Baton Rouge",
    slug: "baton-rouge",
    existingUrl: "/lawn-treatments-baton-rouge/",
    parish: "East Baton Rouge",
    region: "Greater Baton Rouge",
    relatedUrls: [
      "/lawn-fertilization-baton-rouge/",
      "/weed-control-baton-rouge/",
      "/fire-ant-treatments-baton-rouge/",
    ],
  },
  {
    name: "Denham Springs",
    slug: "denham-springs",
    existingUrl: "/lawn-treatment-service-in-denham-springs-la/",
    parish: "Livingston",
    region: "Livingston Parish",
    relatedUrls: ["/lawn-fertilization-denham-springs/"],
  },
  {
    name: "Walker",
    slug: "walker",
    existingUrl: "/lawn-treatment-service-in-walker-la/",
    parish: "Livingston",
    region: "Livingston Parish",
  },
  {
    name: "Central",
    slug: "central",
    existingUrl: "/lawn-treatment-service-in-central-la/",
    parish: "East Baton Rouge",
    region: "Greater Baton Rouge",
  },
  {
    name: "Zachary",
    slug: "zachary",
    parish: "East Baton Rouge",
    region: "Greater Baton Rouge",
  },
  {
    name: "Donaldsonville",
    slug: "donaldsonville",
    parish: "Ascension",
    region: "River Parishes",
  },
  {
    name: "Paulina",
    slug: "paulina",
    parish: "St. James",
    region: "River Parishes",
  },
  {
    name: "Lutcher",
    slug: "lutcher",
    existingUrl: "/lawn-fertilization-lutcher/",
    parish: "St. James",
    region: "River Parishes",
  },
  {
    name: "Gramercy",
    slug: "gramercy",
    parish: "St. James",
    region: "River Parishes",
  },
  {
    name: "Metairie",
    slug: "metairie",
    parish: "Jefferson",
    region: "Metro New Orleans",
  },
  {
    name: "Kenner",
    slug: "kenner",
    parish: "Jefferson",
    region: "Metro New Orleans",
  },
  {
    name: "Madisonville",
    slug: "madisonville",
    parish: "St. Tammany",
    region: "Northshore",
  },
  {
    name: "Covington",
    slug: "covington",
    parish: "St. Tammany",
    region: "Northshore",
  },
  {
    name: "Hammond",
    slug: "hammond",
    parish: "Tangipahoa",
    region: "Florida Parishes",
  },
  {
    name: "Ponchatoula",
    slug: "ponchatoula",
    parish: "Tangipahoa",
    region: "Florida Parishes",
  },
  {
    name: "Springfield",
    slug: "springfield",
    existingUrl: "/lawn-treatment-springfield-la/",
    parish: "Livingston",
    region: "Livingston Parish",
  },
  {
    name: "Addis",
    slug: "addis",
    existingUrl: "/lawn-treatment-addis-la/",
    parish: "West Baton Rouge",
    region: "West Bank",
  },
  {
    name: "Brusly",
    slug: "brusly",
    parish: "West Baton Rouge",
    region: "West Bank",
  },
  {
    name: "Port Allen",
    slug: "port-allen",
    parish: "West Baton Rouge",
    region: "West Bank",
  },
  {
    name: "St. George",
    slug: "st-george",
    parish: "East Baton Rouge",
    region: "Greater Baton Rouge",
  },
  {
    name: "Livingston",
    slug: "livingston",
    existingUrl: "/lawn-treatments-livingston-parish/",
    parish: "Livingston",
    region: "Livingston Parish",
  },
  {
    name: "Port Vincent",
    slug: "port-vincent",
    parish: "Livingston",
    region: "Livingston Parish",
  },
  {
    name: "Baker",
    slug: "baker",
    parish: "East Baton Rouge",
    region: "Greater Baton Rouge",
  },
  {
    name: "Watson",
    slug: "watson",
    parish: "Livingston",
    region: "Livingston Parish",
  },
  {
    name: "Albany",
    slug: "albany",
    parish: "Livingston",
    region: "Livingston Parish",
  },
  {
    name: "Mandeville",
    slug: "mandeville",
    parish: "St. Tammany",
    region: "Northshore",
  },
  {
    name: "Killian",
    slug: "killian",
    parish: "Livingston",
    region: "Livingston Parish",
  },
  {
    name: "Maurepas",
    slug: "maurepas",
    parish: "Livingston",
    region: "Livingston Parish",
  },
  {
    name: "LaPlace",
    slug: "laplace",
    existingUrl: "/lawn-fertilization-laplace/",
    parish: "St. John the Baptist",
    region: "River Parishes",
  },
  {
    name: "Convent",
    slug: "convent",
    parish: "St. James",
    region: "River Parishes",
  },
  {
    name: "Darrow",
    slug: "darrow",
    parish: "Ascension",
    region: "River Parishes",
  },
  {
    name: "White Castle",
    slug: "white-castle",
    parish: "Iberville",
    region: "River Parishes",
  },
  {
    name: "Plaquemine",
    slug: "plaquemine",
    existingUrl: "/lawn-fertilization-plaquemine/",
    parish: "Iberville",
    region: "West Bank",
  },
  {
    name: "Saint Gabriel",
    slug: "saint-gabriel",
    existingUrl: "/lawn-treatment-in-saint-gabriel-la/",
    parish: "Iberville",
    region: "West Bank",
  },
];

/** Parish / multi-city hub pages that exist in WP (not single cities). */
export const serviceAreaHubs = [
  {
    name: "Ascension Parish",
    slug: "ascension",
    existingUrl: "/lawn-treatments-ascension/",
    parish: "Ascension",
    relatedUrls: ["/lawn-fertilization-ascension/", "/weed-control-ascension/"],
  },
  {
    name: "Livingston Parish",
    slug: "livingston-parish",
    existingUrl: "/lawn-treatments-livingston-parish/",
    parish: "Livingston",
  },
  {
    name: "West Baton Rouge",
    slug: "west-baton-rouge",
    existingUrl: "/lawn-treatment-west-baton-rouge-la/",
    parish: "West Baton Rouge",
  },
  {
    name: "Iberville Parish",
    slug: "iberville-parish",
    existingUrl: "/lawn-treatment-and-weed-control-in-iberville-parish/",
    parish: "Iberville",
  },
  {
    name: "East Baton Rouge Parish",
    slug: "east-baton-rouge-parish",
    existingUrl: "/lawn-treatments-east-baton-rouge-parish/",
    parish: "East Baton Rouge",
  },
  {
    name: "Jefferson Parish",
    slug: "jefferson-parish",
    existingUrl: "/lawn-treatments-jefferson-parish/",
    parish: "Jefferson",
  },
  {
    name: "St. James Parish",
    slug: "st-james-parish",
    existingUrl: "/lawn-treatments-st-james-parish/",
    parish: "St. James",
  },
  {
    name: "St. John the Baptist Parish",
    slug: "st-john-the-baptist-parish",
    existingUrl: "/lawn-treatments-st-john-the-baptist-parish/",
    parish: "St. John the Baptist",
  },
  {
    name: "St. Tammany Parish",
    slug: "st-tammany-parish",
    existingUrl: "/lawn-treatments-st-tammany-parish/",
    parish: "St. Tammany",
  },
  {
    name: "Tangipahoa Parish",
    slug: "tangipahoa-parish",
    existingUrl: "/lawn-treatments-tangipahoa-parish/",
    parish: "Tangipahoa",
  },
] as const;

export const serviceAreaCount = serviceAreas.length;

export function serviceAreaBySlug(slug: string): ServiceArea | undefined {
  return serviceAreas.find((a) => a.slug === slug || slugify(a.name) === slug);
}

export const areasWithExistingPages = serviceAreas.filter((a) => a.existingUrl);
export const areasNeedingCoveragePages = serviceAreas.filter((a) => !a.existingUrl);

/** Unique parish names (without forcing the word "Parish"), A–Z. */
export function servedParishNames(): string[] {
  return [...new Set(serviceAreas.map((a) => a.parish).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

/** Unique marketing corridor labels from the 40-city inventory, A–Z. */
export function servedRegionNames(): string[] {
  return [...new Set(serviceAreas.map((a) => a.region).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function parishLabel(parish: string): string {
  return /parish$/i.test(parish) ? parish : `${parish} Parish`;
}

export function servedParishLabels(): string[] {
  return servedParishNames().map(parishLabel);
}

function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/** Compact count line for heroes and chips notes. */
export function coverageShortPhrase(): string {
  return `${serviceAreaCount} communities across ${servedParishNames().length} South Louisiana parishes`;
}

/**
 * Short corridor summary for tight UI (trust strips, chip notes).
 * Full parish names stay on About / Contact / FAQ via coverageParishList().
 */
export function coverageCorridorPhrase(): string {
  return "Greater Baton Rouge, Livingston, River Parishes, West Bank, Northshore, Florida Parishes, and Metro New Orleans";
}

/** Hero / brand-note serving line tied to the office city. */
export function coverageHeroServingLine(officeCity = "St. Amant"): string {
  return `Family-operated lawn specialists based in ${officeCity}, serving ${coverageShortPhrase()}.`;
}

/**
 * Readable parish list for About / Contact / SEO (derived from service-areas.ts).
 * Example: Ascension Parish, East Baton Rouge Parish, …, and West Baton Rouge Parish
 */
export function coverageParishList(): string {
  return formatList(servedParishLabels());
}

/** One-sentence “where we serve” for body copy. */
export function coverageServingBlurb(): string {
  return `Serving ${coverageParishList()} — ${coverageShortPhrase()}.`;
}

/** Meta / LocalBusiness description fragment. */
export function coverageMetaPhrase(): string {
  return `${coverageShortPhrase()} (${coverageParishList()})`;
}

/** Schema.org areaServed entries — one per accepted parish. */
export function areaServedSchema(): string[] {
  return servedParishLabels().map((label) => `${label}, Louisiana`);
}

/**
 * Shared FAQ / coverage copy: 40 communities summarized by parish (keeps answers short).
 */
export function coverageFaqAnswer(officeCity = "St. Amant"): string {
  const parishes = servedParishLabels();
  return `Grow Green accepts customers in ${serviceAreaCount} communities across ${parishes.length} South Louisiana parishes—${formatList(parishes)}—from our office in ${officeCity}. Browse the full city list on our service areas page, or submit your address and we will confirm coverage for your property.`;
}
