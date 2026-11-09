import { geoPageBySlug, type GeoPage } from "../../data/geo-pages.generated";
import { additionalParishHubBySlug } from "../../data/parish-hub-pages";

/** Resolve a geo/parish page from retained WP data or newly added parish hubs. */
export function resolveGeoPage(slug: string): GeoPage | undefined {
  return geoPageBySlug[slug] ?? additionalParishHubBySlug[slug];
}

export function allGeoPageSlugs(): string[] {
  return [...new Set([...Object.keys(geoPageBySlug), ...Object.keys(additionalParishHubBySlug)])];
}

export function allGeoPages(): GeoPage[] {
  const bySlug = new Map<string, GeoPage>();
  for (const page of Object.values(geoPageBySlug)) bySlug.set(page.slug, page);
  for (const page of Object.values(additionalParishHubBySlug)) bySlug.set(page.slug, page);
  return [...bySlug.values()];
}
