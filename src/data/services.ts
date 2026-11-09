export type ServiceRelatedPage = {
  slug: string;
  title: string;
  summary: string;
};

export type Service = {
  slug: string;
  title: string;
  summary: string;
  bullets: string[];
  /** Canonical public path (trailing slash) */
  path?: string;
  /** Related WP pages that expand this category */
  relatedPages?: ServiceRelatedPage[];
  /** Claims scrubbed from WP copy — do not render as confirmed facts */
  scrubbedClaims?: string[];
};

/**
 * Nine service categories retained from AGENTS.md / WP, plus related
 * fungus / insect / plant-disease pages that already exist as distinct URLs.
 * Unsupported social-proof numbers and guarantees are scrubbed from bullets.
 */
export const services: Service[] = [
  {
    slug: "lawn-fertilization-weed-control",
    title: "Lawn Fertilization & Weed Control",
    summary:
      "A season-smart program for South Louisiana warm-season turf—pre- and post-emergent weed control, timely nutrition, and monitoring for insects and disease pressure.",
    bullets: [
      "Pre- and post-emergent weed control selected for weed, turf type, and conditions",
      "Season-specific fertilizer, micronutrients, iron, and potassium timing",
      "Built for St. Augustine, centipede, zoysia, and bermuda lawns",
      "Technicians monitor for common threats such as chinch bugs, armyworms, mole crickets, sod webworms, and large patch",
      "Starting price for lawn fertilization and weed control from $39/month (final pricing depends on lawn size and selected services)",
      "Optional add-ons: fire ant, tree & shrub, aeration, flower bed, and outdoor pest services",
    ],
    scrubbedClaims: [
      "600+ lawns cared for",
      "4.9-star reputation",
      "Satisfaction guaranteed",
      "No long-term contract (confirm terms before emphasizing)",
      "8 planned treatments each year (confirm program still 8 visits)",
    ],
  },
  {
    slug: "flower-bed-weed-control-and-fertilization",
    title: "Flower Bed Weed Control & Fertilization",
    summary:
      "Professional flower bed weed control and fertilization for mulch, rock, pine straw, and landscaped beds—applied carefully around the plants you want to keep.",
    bullets: [
      "Pre- and post-emergent control suited to bed material and desirable plants",
      "Precision applications around flowers and shrubs",
      "Bed fertilization when selected",
      "Focus on maintenance weed control—not landscaping installation",
      "Progressive results: tough or mature weeds may need follow-up treatment",
    ],
    scrubbedClaims: [
      "600+ local lawns",
      "4.9 ★ on Google",
      "No long-term contract (confirm before emphasizing)",
    ],
  },
  {
    slug: "fire-ant-treatment",
    title: "Fire Ant Treatment",
    summary:
      "Fire ant control that goes beyond knocking down visible mounds—combining mound treatment with colony-focused control designed for South Louisiana lawns.",
    bullets: [
      "Visible mound and activity assessment",
      "Colony-focused treatment strategy",
      "Professional products and timing",
      "Ongoing program option instead of one-off mound chasing",
      "Useful around play areas, walkways, pets, and outdoor living spaces",
    ],
  },
  {
    slug: "mosquito-flea-tick-treatments",
    title: "Mosquito, Flea, & Tick Treatments",
    summary:
      "Outdoor mosquito, flea, and tick treatments for South Louisiana’s long warm season—focused on shaded, protected landscape zones where pests rest and hide.",
    bullets: [
      "Season plans and one-time event treatment options",
      "Target shaded resting areas and labeled landscape zones",
      "Inspect likely breeding or harborage sources",
      "Adjust applications to weather and conditions",
      "Goal: meaningful reduction in outdoor pest activity around treated areas",
    ],
    scrubbedClaims: [
      "600+ local lawns",
      "4.9 ★ on Google",
      "8–10 visit season plans (confirm current plan cadence before publishing as a fixed number)",
    ],
  },
  {
    slug: "tree-and-shrub-care",
    title: "Tree and Shrub Care",
    summary:
      "A seasonal ornamental program combining monitoring, targeted pest and disease treatments, and plant nutrition for healthier trees and shrubs.",
    bullets: [
      "Insect and mite monitoring on susceptible plants",
      "Disease-pressure management when treatment is appropriate",
      "Targeted nutrition and micronutrients to support vigor and color",
      "Seasonally adjusted visits—not identical sprays every round",
      "Honest diagnosis: drainage, root damage, and planting-site issues may need more than product",
    ],
    relatedPages: [
      {
        slug: "plant-disease-or-pest",
        title: "Plant Disease Or Pest",
        summary:
          "Symptom-guided intake for ornamental disease and pest concerns—review the plant, growing conditions, and next steps before treating.",
      },
    ],
  },
  {
    slug: "lawn-fungus-and-insects",
    title: "Lawn Fungus and Insect Treatments",
    summary:
      "Targeted help when brown, thinning, or chewed turf may be disease or insect pressure—evaluation first, then the right response for South Louisiana turf.",
    bullets: [
      "Evaluate pattern, grass species, weather, moisture, and maintenance before recommending product",
      "Common disease concerns include large patch, gray leaf spot, dollar spot, and take-all root rot",
      "Common insect concerns include southern chinch bugs, fall armyworms, tropical sod webworms, and mole crickets",
      "Fungicide or insecticide only when timing and target fit; dead tissue will not green back",
      "Rule out drought, irrigation gaps, mowing injury, and compaction when those fit better",
    ],
    relatedPages: [
      {
        slug: "lawn-fungus",
        title: "Lawn Fungus",
        summary:
          "Lawn disease service that separates fungus from look-alike causes before recommending fungicide.",
      },
      {
        slug: "lawn-insects",
        title: "Lawn Insects",
        summary:
          "Turf-insect service that matches evidence to the pest before recommending insecticide.",
      },
    ],
    scrubbedClaims: [
      "600+ local lawns",
      "4.9-star Google rating",
    ],
  },
  {
    slug: "soil-sample",
    title: "Soil Sampling",
    summary:
      "Professional soil sample and lab analysis to reveal nutrients, salts, and pH that drive warm-season lawn performance—plus a clear explanation of what the results mean.",
    bullets: [
      "$55 soil sample including lab analysis and graphic report",
      "Analyzes pH, organic matter, major nutrients, salts/sodium, and key micronutrients",
      "Helps explain yellowing, thin growth, hard-packed soil, or poor fertilizer response",
      "Follow-up plan for pH correction and amendments when results support it",
    ],
    scrubbedClaims: [
      "Overnight green-up after every correction",
      "Guaranteed weed resistance from pH balance alone",
    ],
  },
  {
    slug: "liquid-aeration",
    title: "Liquid Aeration",
    summary:
      "Full-lawn soil-conditioning application that supports more even wetting and water movement—without cores, holes, or a heavy aerator crossing the turf.",
    bullets: [
      "Uniform full-lawn application that reaches tight and awkward areas",
      "No soil plugs left on the surface",
      "Pairs easily with an ongoing lawn program",
      "Benefits develop as soil moisture behavior and roots respond—not overnight green paint",
      "When severe compaction needs immediate mechanical relief, core aeration may be recommended instead",
    ],
  },
  {
    slug: "core-aeration",
    title: "Core Aeration",
    summary:
      "Mechanical core aeration opens compacted soil so air, water, and nutrients can reach the root zone—helping warm-season turf build deeper roots.",
    bullets: [
      "Relieves compacted soil and improves water movement into the root zone",
      "Supports deeper root growth and better fertilizer access",
      "Helps natural thatch breakdown",
      "Leave plugs on the lawn; mowing and weather break them down",
      "Mark irrigation heads, shallow cables, and other obstacles before service",
    ],
  },
];

/** Ensure every service exposes a trailing-slash path. */
for (const s of services) {
  s.path = `/${s.slug}/`;
}

export const serviceBySlug = Object.fromEntries(
  services.map((s) => [s.slug, s]),
) as Record<string, Service>;

/** Flat list of every detail URL slug (category hubs + related pages). */
export const allServicePageSlugs: string[] = services.flatMap((s) => [
  s.slug,
  ...(s.relatedPages?.map((r) => r.slug) ?? []),
]);

/** Related WP pages that are not full category hubs. */
export const relatedServicePages: Record<
  string,
  { title: string; summary: string; bullets: string[]; parentSlug: string }
> = {
  "lawn-fungus": {
    title: "Lawn Fungus",
    parentSlug: "lawn-fungus-and-insects",
    summary:
      "Lawn disease service that separates fungus from look-alike causes before recommending fungicide for South Louisiana turf.",
    bullets: [
      "Evaluate pattern, grass species, weather, and moisture before recommending product",
      "Common concerns: large patch, gray leaf spot, dollar spot, and take-all root rot",
      "Fungicide only when timing and target fit — dead tissue will not green back",
      "Rule out insects, drought, irrigation gaps, mowing injury, and compaction when those fit better",
    ],
  },
  "lawn-insects": {
    title: "Lawn Insects",
    parentSlug: "lawn-fungus-and-insects",
    summary:
      "Turf-insect service that matches evidence to the pest before recommending insecticide.",
    bullets: [
      "Southern chinch bugs, fall armyworms, tropical sod webworms, and mole crickets are common local concerns",
      "Inspect blades, active margins, and soil for evidence before treating",
      "Insecticide only when the pest, timing, and label fit",
      "Disease, drought, and mowing injury can look similar — we separate those first",
    ],
  },
  "plant-disease-or-pest": {
    title: "Plant Disease Or Pest",
    parentSlug: "tree-and-shrub-care",
    summary:
      "Symptom-guided intake for ornamental disease and pest concerns — review the plant, growing conditions, and next steps before treating.",
    bullets: [
      "Sticky leaves, sooty mold, mites, chewed foliage, leaf spots, and dieback are common clues",
      "We review the plant, history, and site conditions — not a single photo in isolation",
      "Treatment is recommended only when it fits the cause",
      "Drainage, root damage, and planting-site issues may need more than product",
    ],
  },
};
