import { articleHtml as winterizingPreEmergents } from "./importance-of-winterizing-your-lawn-and-pre-emergents-in-south-louisiana";

/** Curated article HTML overrides for posts with empty/broken WP extracts. */
export const curatedBlogArticles: Record<string, string> = {
  "importance-of-winterizing-your-lawn-and-pre-emergents-in-south-louisiana": winterizingPreEmergents,
};

export function curatedArticleHtmlFor(slug: string): string | null {
  return curatedBlogArticles[slug] || null;
}
