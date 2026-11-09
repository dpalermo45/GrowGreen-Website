import { serviceAreas } from "./service-areas";

export type ParishFaq = { q: string; a: string };

export type ParishHubCopy = {
  parishKey: string;
  localTitle: string;
  localLead: string;
  climateNote: string;
  turfNote: string;
  faqs: ParishFaq[];
};

function cities(parishKey: string): string {
  const names = serviceAreas
    .filter((a) => a.parish === parishKey)
    .map((a) => a.name)
    .sort((a, b) => a.localeCompare(b));
  if (names.length <= 1) return names[0] || "your community";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export const parishHubCopyByKey: Record<string, ParishHubCopy> = {
  Ascension: {
    parishKey: "Ascension",
    localTitle: "Home parish care from our St. Amant office",
    localLead:
      "Ascension Parish is where Grow Green is based. From St. Amant, Prairieville, and Gonzales to Geismar, Dutchtown, Sorrento, Donaldsonville, and Darrow, the same local team handles estimates, treatments, and office support.",
    climateNote:
      "Ascension summers push rapid weed growth and heat stress on warm-season turf. We time nutrition and weed control around local growing conditions rather than a fixed national calendar.",
    turfNote:
      "St. Augustine and centipede are common here, with bermuda and zoysia on many sunny lots. Shade from oaks and fences changes how weeds and fertilizer should be managed.",
    faqs: [
      {
        q: "Which Ascension Parish cities do you serve?",
        a: `We accept customers in ${cities("Ascension")}. Send any Ascension address for a coverage check.`,
      },
      {
        q: "Are you based nearby?",
        a: "Yes. Grow Green is based in St. Amant in Ascension Parish, so parish customers work with a local office—not a distant call center.",
      },
    ],
  },
  Livingston: {
    parishKey: "Livingston",
    localTitle: "Livingston Parish lawns from Denham Springs to Albany",
    localLead:
      "Livingston Parish coverage includes Denham Springs, Walker, Springfield, Livingston, Port Vincent, Watson, Albany, Killian, and Maurepas—with estimates reviewed from our Ascension-based office.",
    climateNote:
      "Livingston Parish sees heavy summer growth, wet stretches, and cool-season weed pressure in fall and winter. Visit timing follows turf response and weather, not identical applications every trip.",
    turfNote:
      "Neighborhood lawns and larger rural lots both appear across the parish. We measure treatable turf so pricing reflects the lawn you want treated.",
    faqs: [
      {
        q: "Do you serve rural Livingston Parish addresses?",
        a: "Often yes—coverage is confirmed from the service address and ZIP. Share gate codes or access notes on the estimate form when needed.",
      },
      {
        q: "Which Livingston communities are listed?",
        a: `Confirmed communities include ${cities("Livingston")}.`,
      },
    ],
  },
  "West Baton Rouge": {
    parishKey: "West Baton Rouge",
    localTitle: "West Bank lawn care in West Baton Rouge Parish",
    localLead:
      "Across the river in Addis, Brusly, and Port Allen, Grow Green provides the same fertilization and weed-control program used throughout our Greater Baton Rouge coverage.",
    climateNote:
      "West Baton Rouge lawns share the region’s humidity and long growing season, with river-corridor conditions that keep weed pressure active most of the year.",
    turfNote:
      "Many properties mix sunny front lawns with tighter side yards. We focus on treatable turf and keep bed or ant work as optional add-ons.",
    faqs: [
      {
        q: "Which West Baton Rouge Parish towns do you serve?",
        a: `We serve ${cities("West Baton Rouge")}. Request an estimate with your street address to confirm coverage.`,
      },
      {
        q: "Do I need a separate West Bank company?",
        a: "No. The same Grow Green team that serves Ascension and East Baton Rouge also covers listed West Baton Rouge communities.",
      },
    ],
  },
  Iberville: {
    parishKey: "Iberville",
    localTitle: "Iberville Parish coverage along the West Bank corridor",
    localLead:
      "Iberville Parish service includes Plaquemine, Saint Gabriel, and White Castle—with clear estimates based on treatable lawn area and selected services.",
    climateNote:
      "Iberville’s river-parish humidity and heat keep warm-season weeds active. Prevention timing and targeted control matter more than spraying the same mix every visit.",
    turfNote:
      "Expect a mix of St. Augustine, centipede, and bermuda. Tell us about shade, drainage, or irrigation so the plan matches the yard.",
    faqs: [
      {
        q: "Where in Iberville Parish do you provide service?",
        a: `Confirmed communities include ${cities("Iberville")}.`,
      },
      {
        q: "Is this only weed control?",
        a: "The core program combines fertilization and weed control. Related services such as fire ants, beds, or aeration can be added when needed.",
      },
    ],
  },
  "East Baton Rouge": {
    parishKey: "East Baton Rouge",
    localTitle: "East Baton Rouge Parish—from city lots to suburban corridors",
    localLead:
      "East Baton Rouge Parish is one of our primary corridors. We serve Baton Rouge, Central, Zachary, St. George, and Baker with season-smart liquid lawn programs.",
    climateNote:
      "Mature tree shade, clay soils, and intense summer heat shape how turf and weeds respond. We adjust nutrition and weed control to what the lawn is doing that season.",
    turfNote:
      "City and suburban lawns vary widely in size and sun exposure. Pricing is based on measured treatable area—not a one-size parish flat rate.",
    faqs: [
      {
        q: "Which East Baton Rouge communities do you serve?",
        a: `Confirmed locations include ${cities("East Baton Rouge")}.`,
      },
      {
        q: "Can you treat a shaded Baton Rouge lawn?",
        a: "Yes. Shade changes grass vigor and weed pressure. We note conditions during the estimate and visits so recommendations stay realistic.",
      },
    ],
  },
  Jefferson: {
    parishKey: "Jefferson",
    localTitle: "Jefferson Parish lawn treatments for Metairie and Kenner",
    localLead:
      "In Jefferson Parish we serve Metairie and Kenner with the same firefighter-owned lawn-treatment approach used across our South Louisiana coverage map.",
    climateNote:
      "Metro New Orleans humidity, irrigation habits, and compact lots create steady weed and fungus pressure. Seasonal prevention helps more than occasional spot sprays alone.",
    turfNote:
      "Lots are often smaller with beds and hardscape. We measure treatable turf carefully so you are not priced for area that cannot be treated.",
    faqs: [
      {
        q: "Do you serve all of Jefferson Parish?",
        a: `We list ${cities("Jefferson")} as confirmed communities. Send your address if you are nearby and want a coverage check.`,
      },
      {
        q: "How far is the office?",
        a: "Our office is in St. Amant. Estimates and scheduling still go through the local Grow Green team during Monday–Friday business hours.",
      },
    ],
  },
  "St. James": {
    parishKey: "St. James",
    localTitle: "River Parishes care in St. James Parish",
    localLead:
      "St. James Parish coverage includes Lutcher, Gramercy, Paulina, and Convent—practical lawn fertilization and weed control for River Parish warm-season turf.",
    climateNote:
      "River Parish weather swings from wet spells to hot, dry stretches. We watch moisture and weed activity so applications fit conditions on the ground.",
    turfNote:
      "Properties range from town lots to wider yards. Tell us about dogs, kids’ play areas, or irrigation so aftercare instructions stay clear.",
    faqs: [
      {
        q: "Which St. James Parish towns are covered?",
        a: `We serve ${cities("St. James")}.`,
      },
      {
        q: "Do you mow lawns in St. James Parish?",
        a: "No. Grow Green is a lawn-treatment company focused on fertilization, weed control, and related outdoor treatments—not mowing.",
      },
    ],
  },
  "St. John the Baptist": {
    parishKey: "St. John the Baptist",
    localTitle: "LaPlace and St. John the Baptist Parish lawn care",
    localLead:
      "In St. John the Baptist Parish we serve LaPlace with season-smart fertilization and weed control timed for South Louisiana warm-season grass.",
    climateNote:
      "LaPlace lawns face long summers and persistent weeds. A planned visit rhythm generally works better than waiting until the lawn is fully overtaken.",
    turfNote:
      "Share grass type if you know it, plus any soggy or high-traffic spots. That helps us recommend a practical starting plan.",
    faqs: [
      {
        q: "Where do you serve in St. John the Baptist Parish?",
        a: `Confirmed coverage includes ${cities("St. John the Baptist")}. Other nearby addresses can be reviewed from the estimate form.`,
      },
      {
        q: "What does pricing start at?",
        a: "Lawn fertilization and weed control plans start at $39/month. Final pricing depends on lawn size and selected services.",
      },
    ],
  },
  "St. Tammany": {
    parishKey: "St. Tammany",
    localTitle: "Northshore lawn treatments in St. Tammany Parish",
    localLead:
      "St. Tammany Parish service covers Covington, Mandeville, and Madisonville—Northshore lawns that often mix pine shade, sandy soils, and humid summers.",
    climateNote:
      "Northshore conditions can differ from the river parishes: more tree shade, different soil texture, and strong summer weed pressure. Local observation beats a copied schedule.",
    turfNote:
      "Centipede and St. Augustine are common under trees; sunnier lots may carry bermuda or zoysia. We match nutrition and weed control to the grass you have.",
    faqs: [
      {
        q: "Which St. Tammany communities do you serve?",
        a: `We serve ${cities("St. Tammany")}.`,
      },
      {
        q: "Can beds or trees be added later?",
        a: "Yes. Flower-bed weed control and tree-and-shrub care are optional add-ons when you want them—not required to start a lawn program.",
      },
    ],
  },
  Tangipahoa: {
    parishKey: "Tangipahoa",
    localTitle: "Tangipahoa Parish lawn care for Hammond and Ponchatoula",
    localLead:
      "Tangipahoa Parish coverage includes Hammond and Ponchatoula, with the same clear estimate process and seasonal lawn program used across our Florida Parishes corridor.",
    climateNote:
      "Florida Parishes humidity and vigorous summer growth keep weeds active. Pre-emergent timing and post-emergent follow-up are part of keeping progress through the year.",
    turfNote:
      "Campus-adjacent lots, neighborhood yards, and wider properties all appear in this corridor. We price from treatable lawn area and selected services.",
    faqs: [
      {
        q: "Which Tangipahoa Parish cities do you serve?",
        a: `Confirmed communities include ${cities("Tangipahoa")}.`,
      },
      {
        q: "How do I get an estimate?",
        a: "Use the form on this page with your service address, or call (225) 461-3199 Monday–Friday, 8 AM–4 PM.",
      },
    ],
  },
};

export function parishHubCopyFor(parishKey: string): ParishHubCopy | null {
  return parishHubCopyByKey[parishKey] ?? null;
}
