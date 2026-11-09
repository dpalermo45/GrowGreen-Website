import { serviceAreas } from "./service-areas";
import type { ServiceAreaImage } from "./service-area-content-types";

type PoolKind = "lawn" | "truck" | "property";

type PoolPhoto = {
  id: number;
  kind: PoolKind;
  fileBase: string;
  /** Unique, descriptive alt — what is visible in the photo. */
  alt: string;
  width: number;
  height: number;
};

const TRUCK_IDS = new Set([4, 7, 17, 18, 39, 42]);
const PROPERTY_IDS = new Set([2, 5, 19, 21, 22, 23, 24, 28, 29, 30, 31, 32, 34]);

/** Unique alt text per source photo (claims-safe: describes the image, not a city). */
const UNIQUE_ALT: Record<number, string> = {
  1: "Thick green backyard lawn enclosed by a wooden privacy fence after Grow Green Weed Control care",
  2: "Brick home with a clean concrete driveway and evenly green front lawn by Grow Green Weed Control",
  3: "Long residential grass strip between driveways showing uniform turf color from Grow Green Weed Control",
  4: "Grow Green Weed Control truck connected to a yellow treatment hose across a residential lawn",
  5: "Suburban driveway and manicured lawn in front of a two-story home treated by Grow Green Weed Control",
  7: "Grow Green Weed Control flatbed spray truck parked on a residential street with hose on the lawn",
  8: "Dappled sunlight across a deep green residential lawn maintained by Grow Green Weed Control",
  10: "Close view of dense warm-season turf after fertilization and weed control by Grow Green",
  11: "Backyard lawn beside a brick home cared for by Grow Green Weed Control",
  12: "Healthy green lawn along a landscaped shrub bed treated by Grow Green Weed Control",
  13: "Residential turf edge meeting a concrete walkway after Grow Green Weed Control service",
  14: "Even green lawn surface showing consistent color from Grow Green fertilization and weed control",
  15: "Front-yard turf and landscape bed maintained with Grow Green Weed Control treatments",
  16: "Lush residential grass with clean mowing lines after Grow Green Weed Control care",
  17: "Grow Green Weed Control van beside a sidewalk and green lawns on a South Louisiana street",
  18: "Branded Grow Green Weed Control truck parked beside a residential sidewalk and lawn",
  19: "Large two-story home with a wide green front lawn treated by Grow Green Weed Control",
  20: "Fenced backyard lawn with a playset area maintained by Grow Green Weed Control",
  21: "Ranch-style home with a broad front lawn cared for by Grow Green Weed Control",
  22: "Curb-appeal lawn and brick home exterior after Grow Green Weed Control treatments",
  23: "Sunny residential lawn and driveway entrance maintained by Grow Green Weed Control",
  24: "Front lawn and arched entry home showing thick green turf from Grow Green Weed Control",
  25: "Green residential lawn framed by trees after Grow Green Weed Control service",
  26: "Uniform turf color across a suburban yard treated by Grow Green Weed Control",
  27: "Side-yard grass strip between driveway and privacy fence after Grow Green Weed Control care",
  28: "Home frontage with shrub beds and a green lawn maintained by Grow Green Weed Control",
  29: "Wide green lawn in front of a brick and stucco home treated by Grow Green Weed Control",
  30: "Residential property lawn with clean edges from Grow Green Weed Control programs",
  31: "Deep green front lawn under a clear sky after Grow Green Weed Control treatments",
  32: "Healthy lawn and landscape border cared for by Grow Green Weed Control",
  34: "Vibrant green lawn and mulched tree ring at a brick home treated by Grow Green Weed Control",
  35: "Backyard turf with wooden fence line maintained by Grow Green Weed Control",
  36: "Residential lawn and garden bed after Grow Green Weed Control fertilization and weed control",
  37: "Compact backyard lawn bordered by shrubs and cared for by Grow Green Weed Control",
  38: "Narrow green lawn between driveway and fence after Grow Green Weed Control service",
  39: "Yellow spray hose across a green lawn leading to a Grow Green Weed Control treatment truck",
  40: "Shaded residential lawn with thick turf from Grow Green Weed Control care",
  41: "Lawn meeting a landscaped shrub bed treated by Grow Green Weed Control",
  42: "Grow Green Weed Control truck in a driveway during an active lawn treatment visit",
};

const POOL_IDS = [
  1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
  29, 30, 31, 32, 34, 35, 36, 37, 38, 39, 40, 41, 42,
] as const;

function kindFor(id: number): PoolKind {
  if (TRUCK_IDS.has(id)) return "truck";
  if (PROPERTY_IDS.has(id)) return "property";
  return "lawn";
}

function fileBaseFor(id: number, kind: PoolKind): string {
  const suffix = String(id).padStart(2, "0");
  if (kind === "truck") return `grow-green-service-truck-${suffix}`;
  if (kind === "property") return `grow-green-home-lawn-${suffix}`;
  return `grow-green-lawn-care-${suffix}`;
}

function poolPhoto(id: number): PoolPhoto {
  const kind = kindFor(id);
  return {
    id,
    kind,
    fileBase: fileBaseFor(id, kind),
    alt: UNIQUE_ALT[id] || "Grow Green Weed Control lawn care photo",
    width: 480,
    height: 640,
  };
}

export const serviceAreaPhotoPool: PoolPhoto[] = POOL_IDS.map(poolPhoto);

const SECONDARY_HIGHLIGHTS = [7, 42, 21, 34, 17].map(poolPhoto);

const GALLERY_SIZES = "(max-width: 700px) 100vw, (max-width: 1100px) 58vw, 640px";

function captionFor(cityName: string, kind: PoolKind | "community", isPrimary: boolean): string {
  if (kind === "community") {
    return `Grow Green Weed Control team at a community event — lawn care serving ${cityName}, LA`;
  }
  if (kind === "truck") {
    return isPrimary
      ? `Grow Green Weed Control on a treatment route for ${cityName}, LA homeowners`
      : `Professional lawn treatments available in ${cityName}, LA from Grow Green Weed Control`;
  }
  if (kind === "property") {
    return isPrimary
      ? `Lawn fertilization and weed control serving ${cityName}, LA homes`
      : `Curb-appeal lawn care for ${cityName}, LA from Grow Green Weed Control`;
  }
  return isPrimary
    ? `Healthy turf programs for ${cityName}, LA from Grow Green Weed Control`
    : `Residential lawn care serving ${cityName}, LA and nearby communities`;
}

function toPageImage(
  photo: PoolPhoto | { kind: "community"; src: string; alt: string; width: number; height: number; srcSm?: string },
  cityName: string,
  isPrimary: boolean,
): ServiceAreaImage {
  if ("fileBase" in photo) {
    const full = `/images/service-areas/${photo.fileBase}.webp`;
    const sm = `/images/service-areas/${photo.fileBase}-480.webp`;
    return {
      src: full,
      alt: photo.alt,
      caption: captionFor(cityName, photo.kind, isPrimary),
      width: photo.width,
      height: photo.height,
      srcSet: `${sm} 480w, ${full} ${photo.width}w`,
      sizes: GALLERY_SIZES,
    };
  }

  const srcSm = photo.srcSm || photo.src;
  return {
    src: photo.src,
    alt: photo.alt,
    caption: captionFor(cityName, photo.kind, isPrimary),
    width: photo.width,
    height: photo.height,
    srcSet: `${srcSm} 640w, ${photo.src} ${photo.width}w`,
    sizes: GALLERY_SIZES,
  };
}

type RawAssignment = {
  citySlug: string;
  photos: Array<PoolPhoto | { kind: "community"; src: string; alt: string; width: number; height: number; srcSm?: string }>;
};

function buildRawAssignments(): RawAssignment[] {
  const cities = serviceAreas.map((a) => ({ slug: a.slug, name: a.name }));
  const others = cities.filter((c) => c.slug !== "prairieville");
  const pool = [...serviceAreaPhotoPool];

  if (pool.length < others.length) {
    throw new Error(`Not enough service-area photos: need ${others.length}, have ${pool.length}`);
  }

  const rows: RawAssignment[] = [
    {
      citySlug: "prairieville",
      photos: [
        {
          kind: "community",
          src: "/images/service-areas/prairieville.webp",
          alt: "Grow Green Weed Control team and mascot at a Prairieville community event",
          width: 1024,
          height: 768,
          srcSm: "/images/service-areas/prairieville-640.webp",
        },
        poolPhoto(8),
        poolPhoto(7),
      ],
    },
  ];

  others.forEach((city, index) => {
    const primary = pool[index];
    const photos: RawAssignment["photos"] = [primary];
    if (index < SECONDARY_HIGHLIGHTS.length * 2) {
      const extra = SECONDARY_HIGHLIGHTS[index % SECONDARY_HIGHLIGHTS.length];
      if (extra.id !== primary.id) photos.push(extra);
    }
    rows.push({ citySlug: city.slug, photos });
  });

  return rows;
}

const rawAssignments = buildRawAssignments();

/** City display name lookup. */
const cityNameBySlug = Object.fromEntries(serviceAreas.map((a) => [a.slug, a.name]));

/**
 * Resolve gallery images for a city page with unique alts + local captions.
 * Captions name the service city; alts only describe what is visible in the photo.
 */
export function resolveServiceAreaImages(
  slug: string,
  contentImage?: { src: string; alt: string },
): ServiceAreaImage[] {
  const cityName = cityNameBySlug[slug] || "South Louisiana";
  const row = rawAssignments.find((r) => r.citySlug === slug);

  if (row) {
    return row.photos.map((photo, index) => toPageImage(photo, cityName, index === 0));
  }

  if (!contentImage) return [];

  return [
    {
      src: contentImage.src,
      alt: contentImage.alt,
      caption: captionFor(cityName, "lawn", true),
      width: 1024,
      height: 768,
      sizes: GALLERY_SIZES,
    },
  ];
}

/** @deprecated Prefer resolveServiceAreaImages(slug) — kept for debugging assignments. */
export const serviceAreaImagesBySlug: Record<string, ServiceAreaImage[]> = Object.fromEntries(
  rawAssignments.map((row) => [
    row.citySlug,
    row.photos.map((photo, index) =>
      toPageImage(photo, cityNameBySlug[row.citySlug] || "South Louisiana", index === 0),
    ),
  ]),
);
