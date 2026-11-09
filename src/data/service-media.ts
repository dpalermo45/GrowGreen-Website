/** Visual treatments for service cards — authentic photos where available. */
export type ServiceMedia = {
  slug: string;
  image?: string;
  imageAlt?: string;
  blurb: string;
  /** When no suitable photo exists, use branded green panel */
  branded?: boolean;
};

export const serviceMediaBySlug: Record<string, ServiceMedia> = {
  "lawn-fertilization-weed-control": {
    slug: "lawn-fertilization-weed-control",
    image: "/images/hero/lawn-results.webp",
    imageAlt: "Healthy treated lawn in South Louisiana",
    blurb: "Season-smart weed control and fertilization for warm-season turf.",
  },
  "flower-bed-weed-control-and-fertilization": {
    slug: "flower-bed-weed-control-and-fertilization",
    image: "/images/services/flower-bed-card.webp",
    imageAlt: "Landscaped flower bed ready for weed control",
    blurb: "Careful bed weed control around the plants you want to keep.",
  },
  "fire-ant-treatment": {
    slug: "fire-ant-treatment",
    image: "/images/services/ant-mound.webp",
    imageAlt: "Fire ant mound in a lawn",
    blurb: "Colony-focused fire ant control for yards and play areas.",
  },
  "mosquito-flea-tick-treatments": {
    slug: "mosquito-flea-tick-treatments",
    image: "/images/services/mosquito.webp",
    imageAlt: "Outdoor landscape area where mosquitoes and ticks often gather",
    blurb: "Outdoor mosquito, flea, and tick treatments for shaded landscapes.",
  },
  "tree-and-shrub-care": {
    slug: "tree-and-shrub-care",
    image: "/images/about/kyle-tree-shrub-care.webp",
    imageAlt: "Grow Green technician reviewing tree and shrub care",
    blurb: "Seasonal monitoring, pest care, and nutrition for ornamentals.",
  },
  "lawn-fungus-and-insects": {
    slug: "lawn-fungus-and-insects",
    image: "/images/services/lawn-fungus-large-patch-720.webp",
    imageAlt:
      "Yellow-brown circular patch in an otherwise green St. Augustine lawn—an example of large patch disease",
    blurb: "Evaluate first, then treat fungus or insects when they fit.",
  },
  "soil-sample": {
    slug: "soil-sample",
    image: "/images/services/soil-sampling.webp",
    imageAlt: "Soil sampling tools on a lawn",
    blurb: "Lab analysis of nutrients, salts, and pH for your lawn.",
  },
  "liquid-aeration": {
    slug: "liquid-aeration",
    branded: true,
    blurb: "Full-lawn soil conditioning without cores or heavy equipment.",
  },
  "core-aeration": {
    slug: "core-aeration",
    image: "/images/services/core-aeration.webp",
    imageAlt: "Core aeration plugs on turf",
    blurb: "Mechanical cores that open compacted soil for healthier roots.",
  },
};
