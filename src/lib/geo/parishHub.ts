import type { GeoPage } from "../../data/geo-pages.generated";
import { serviceAreas, serviceAreaHubs, type ServiceArea } from "../../data/service-areas";

export type ParishHubMeta = {
  parishKey: string;
  parishLabel: string;
  displayTitle: string;
  eyebrow: string;
  intro: string;
  focusNote: string;
  communities: ServiceArea[];
  relatedHubPaths: string[];
};

function parishLabel(parish: string): string {
  return /parish$/i.test(parish) ? parish : `${parish} Parish`;
}

function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/** Match a geo page to a parish / multi-city hub from service-area inventory. */
export function findServiceAreaHub(page: GeoPage) {
  const path = page.path.endsWith("/") ? page.path : `${page.path}/`;
  return (
    serviceAreaHubs.find((hub) => {
      if (hub.existingUrl === path) return true;
      const related = "relatedUrls" in hub ? hub.relatedUrls : undefined;
      return Array.isArray(related) && related.includes(path);
    }) ?? null
  );
}

export function isParishHubPage(page: GeoPage): boolean {
  if (findServiceAreaHub(page)) return true;
  if (page.focus === "parish") return true;
  return /parish$/i.test(page.cityName) || /(?:^|-)parish(?:-|$)/i.test(page.slug);
}

/** Correct known bad generator mappings (e.g. West Baton Rouge matched as Baton Rouge). */
function resolveParishKey(page: GeoPage): string {
  const hub = findServiceAreaHub(page);
  if (hub) return hub.parish;

  if (/west-baton-rouge/i.test(page.slug)) return "West Baton Rouge";
  if (/livingston/i.test(page.slug)) return "Livingston";
  if (/iberville/i.test(page.slug)) return "Iberville";
  if (/ascension/i.test(page.slug)) return "Ascension";

  if (page.parish) return page.parish;
  if (/parish$/i.test(page.cityName)) return page.cityName.replace(/\s+Parish$/i, "");
  return page.cityName;
}

function focusNoteFor(page: GeoPage, parishLabelText: string): string {
  if (/lawn-treatment/i.test(page.slug)) {
    return `This ${parishLabelText} hub covers lawn fertilization, weed control, and related treatments from the same local Grow Green office.`;
  }
  if (page.slug.includes("weed-control")) {
    return `This ${parishLabelText} page focuses on weed prevention and control as part of a full lawn-treatment plan.`;
  }
  if (page.slug.includes("fertilization")) {
    return `This ${parishLabelText} page focuses on fertilization and season-smart nutrition for warm-season turf.`;
  }
  return `This ${parishLabelText} hub covers lawn fertilization, weed control, and related treatments from the same local Grow Green office.`;
}

function introFor(parishLabelText: string, communities: ServiceArea[]): string {
  const names = communities.map((c) => c.name);
  const sample = names.slice(0, Math.min(4, names.length));
  const where =
    sample.length > 0
      ? names.length > sample.length
        ? `Communities we serve include ${formatList(sample)}, plus more across the parish.`
        : `Communities we serve include ${formatList(sample)}.`
      : `We confirm coverage from your service address.`;

  return `Grow Green provides professional lawn fertilization and weed control across ${parishLabelText}. ${where} Treatments are timed for warm-season turf, South Louisiana weather, and month-to-month plans that start at $39/month.`;
}

function titleFor(page: GeoPage, parishLabelText: string): string {
  // Primary parish hubs (and combo titles) stay on lawn treatments.
  if (/lawn-treatment/i.test(page.slug)) return `Lawn Treatments in ${parishLabelText}`;
  if (page.slug.includes("weed-control")) return `Weed Control in ${parishLabelText}`;
  if (page.slug.includes("fertilization")) return `Lawn Fertilization in ${parishLabelText}`;
  return `Lawn Treatments in ${parishLabelText}`;
}

export function resolveParishHub(page: GeoPage): ParishHubMeta {
  const parishKey = resolveParishKey(page);
  const label = parishLabel(parishKey);
  const hub = findServiceAreaHub(page);

  const communities = serviceAreas
    .filter((area) => area.parish === parishKey)
    .sort((a, b) => a.name.localeCompare(b.name));

  const related = hub && "relatedUrls" in hub && Array.isArray(hub.relatedUrls) ? hub.relatedUrls : [];
  const relatedHubPaths = [hub?.existingUrl, ...related].filter(
    (p): p is string => Boolean(p) && p !== page.path,
  );

  return {
    parishKey,
    parishLabel: label,
    displayTitle: titleFor(page, label),
    eyebrow: `${label} · South Louisiana`,
    intro: introFor(label, communities),
    focusNote: focusNoteFor(page, label),
    communities,
    relatedHubPaths,
  };
}
