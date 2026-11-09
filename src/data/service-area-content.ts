import { serviceAreas, type ServiceArea } from "./service-areas";
import type { ServiceAreaContent } from "./service-area-content-types";
import { batchAscensionEbr } from "./service-area-content/batch-ascension-ebr";
import { batchLivingstonWbrIberville } from "./service-area-content/batch-livingston-wbr-iberville";
import { batchNorthshoreRiverMetro } from "./service-area-content/batch-northshore-river-metro";
import { resolveServiceAreaImages } from "./service-area-images";

export type { ServiceAreaContent, ServiceAreaImage, ServiceAreaSection } from "./service-area-content-types";

const bySlug: Record<string, ServiceAreaContent> = {
  ...batchAscensionEbr,
  ...batchLivingstonWbrIberville,
  ...batchNorthshoreRiverMetro,
};

export type ServiceAreaPage = ServiceArea & {
  content: ServiceAreaContent;
};

function withResolvedImages(slug: string, content: ServiceAreaContent): ServiceAreaContent {
  const images = resolveServiceAreaImages(slug, content.image);
  return {
    ...content,
    images,
    image: images[0],
  };
}

export function getServiceAreaContent(slug: string): ServiceAreaContent | undefined {
  const content = bySlug[slug];
  return content ? withResolvedImages(slug, content) : undefined;
}

export function getServiceAreaPage(slug: string): ServiceAreaPage | undefined {
  const area = serviceAreas.find((a) => a.slug === slug);
  const content = bySlug[slug];
  if (!area || !content) return undefined;
  return { ...area, content: withResolvedImages(slug, content) };
}

/** Resolve nearby links: curated slugs first, else same parish/region. */
export function nearbyServiceAreas(area: ServiceArea, limit = 6): ServiceArea[] {
  const content = bySlug[area.slug];
  const curated = (content?.nearbySlugs || [])
    .map((slug) => serviceAreas.find((a) => a.slug === slug))
    .filter((a): a is ServiceArea => Boolean(a && a.slug !== area.slug));

  if (curated.length >= 3) return curated.slice(0, limit);

  const clustered = serviceAreas.filter(
    (a) =>
      a.slug !== area.slug &&
      (a.parish === area.parish || a.region === area.region),
  );
  const merged = [...curated];
  for (const a of clustered) {
    if (!merged.some((m) => m.slug === a.slug)) merged.push(a);
    if (merged.length >= limit) break;
  }
  return merged.slice(0, limit);
}

/** Fail fast in tests/build if any inventory city is missing unique copy. */
export function assertAllServiceAreaContentPresent(): string[] {
  return serviceAreas.map((a) => a.slug).filter((slug) => !bySlug[slug]);
}
