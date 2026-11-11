import { articleHtml as winterizingPreEmergents } from "./importance-of-winterizing-your-lawn-and-pre-emergents-in-south-louisiana";
import { articleHtml as woollyAphidsCrepeMyrtle } from "./woolly-aphids-on-crepe-myrtle-baton-rouge";

/** Curated article HTML overrides for posts with empty/broken WP extracts. */
export const curatedBlogArticles: Record<string, string> = {
  "importance-of-winterizing-your-lawn-and-pre-emergents-in-south-louisiana": winterizingPreEmergents,
  "woolly-aphids-on-crepe-myrtle-baton-rouge": woollyAphidsCrepeMyrtle,
};

export function curatedArticleHtmlFor(slug: string): string | null {
  return curatedBlogArticles[slug] || null;
}
