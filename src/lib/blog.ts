import type { BlogPost } from "../data/blog-posts.generated";
import { blogPosts } from "../data/blog-posts.generated";

export type BlogTopic =
  | "Weeds"
  | "Fertilization"
  | "Insects"
  | "Disease"
  | "Seasonal care"
  | "Turf tips"
  | "Lawn tips";

export type RelatedService = { label: string; href: string };

export function topicFor(slug: string, title: string): BlogTopic {
  const hay = `${slug} ${title}`.toLowerCase();
  if (/picker|sticker|burweed|dallis|weed/.test(hay)) return "Weeds";
  if (/fertiliz/.test(hay)) return "Fertilization";
  if (/insect|chinch|army|webworm/.test(hay)) return "Insects";
  if (/fungus|large-patch|disease/.test(hay)) return "Disease";
  if (/winter|pre-emergent/.test(hay)) return "Seasonal care";
  if (/centipede|grass|lawn/.test(hay)) return "Turf tips";
  return "Lawn tips";
}

export function thumbFor(slug: string): string {
  return `/images/blog/${slug}-640.webp`;
}

export function cleanExcerpt(post: BlogPost, max = 160): string {
  const candidates = [...(post.paragraphs || []), post.seoDesc || ""].filter(Boolean);

  for (const raw of candidates) {
    const text = raw.replace(/\s+/g, " ").trim();
    if (text.length < 50) continue;
    if (/get a free|call or text|lawn treatment program|flower bed weed/i.test(text)) continue;
    if (/welcome to our (lawn|blog)|today,? we.re delving/i.test(text)) continue;
    if (/^\d+\s/.test(text) && text.length < 80) continue;
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    const lastSpace = cut.lastIndexOf(" ");
    return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`;
  }

  return "Practical lawn care guidance for warm-season turf across South Louisiana.";
}

export function readingMinutes(post: BlogPost, extraParagraphs: string[] = []): number {
  const text = [...(post.paragraphs || []), ...extraParagraphs, post.seoDesc || ""].join(" ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.round(words / 200) || 3);
}

export function relatedServicesFor(topic: BlogTopic): RelatedService[] {
  switch (topic) {
    case "Weeds":
      return [
        { label: "Lawn Fertilization & Weed Control", href: "/lawn-fertilization-weed-control/" },
        { label: "Flower Bed Weed Control", href: "/flower-bed-weed-control-and-fertilization/" },
      ];
    case "Fertilization":
    case "Seasonal care":
    case "Turf tips":
    case "Lawn tips":
      return [
        { label: "Lawn Fertilization & Weed Control", href: "/lawn-fertilization-weed-control/" },
        { label: "Soil Sampling", href: "/soil-sample/" },
      ];
    case "Insects":
      return [
        { label: "Lawn Insect Control", href: "/lawn-insects/" },
        { label: "Fire Ant Treatment", href: "/fire-ant-treatment/" },
        { label: "Mosquito, Flea & Tick", href: "/mosquito-flea-tick-treatments/" },
      ];
    case "Disease":
      return [
        { label: "Lawn Fungus Control", href: "/lawn-fungus/" },
        { label: "Lawn Fertilization & Weed Control", href: "/lawn-fertilization-weed-control/" },
      ];
  }
}

export function relatedPostsFor(slug: string, topic: BlogTopic, limit = 3): BlogPost[] {
  const sameTopic = blogPosts.filter(
    (p) => p.slug !== slug && topicFor(p.slug, p.title) === topic,
  );
  const fillers = blogPosts
    .filter((p) => p.slug !== slug && !sameTopic.some((s) => s.slug === p.slug))
    .sort((a, b) => Number(b.priority) - Number(a.priority));
  return [...sameTopic, ...fillers].slice(0, limit);
}

/** Known thin posts that only retain a video from the WP extract. */
export const blogVideoEmbeds: Record<string, { youtubeId: string; title: string }> = {
  "excellent-results-with-our-lawn-treatment-program": {
    youtubeId: "eq6W82CMly4",
    title: "Grow Green lawn treatment results",
  },
};
