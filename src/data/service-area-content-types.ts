export type ServiceAreaSection = {
  heading: string;
  paragraphs: string[];
};

/** Local-page photo with SEO/accessibility fields. */
export type ServiceAreaImage = {
  src: string;
  alt: string;
  /** Visible caption — page-local, claims-safe (does not invent photo location). */
  caption: string;
  width: number;
  height: number;
  srcSet?: string;
  sizes?: string;
};

export type ServiceAreaContent = {
  headline: string;
  metaDescription: string;
  intro: string;
  sections: ServiceAreaSection[];
  /** Preferred nearby area slugs; falls back to parish/region clustering. */
  nearbySlugs?: string[];
  /** Primary photo (first gallery image). Prefer `images` when multiple. */
  image?: ServiceAreaImage;
  /** One or more local/service photos for the page gallery. */
  images?: ServiceAreaImage[];
};
