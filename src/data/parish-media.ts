/**
 * Parish hub photography — illustrative South Louisiana lawn/treatment photos.
 * Do not invent city/parish claims in alt text; assignment is for visual variety only.
 */

export type ParishPhoto = {
  id: string;
  /** Base filename under /images/parishes/ without size suffix */
  slug: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};

export type ParishMediaSet = {
  parishKey: string;
  hero: ParishPhoto;
  gallery: ParishPhoto[];
};

const photos: Record<string, ParishPhoto> = {
  "lawn-treatment-truck-hose-street": {
    id: "lawn-treatment-truck-hose-street",
    slug: "lawn-treatment-truck-hose-street",
    alt: "Yellow lawn treatment hose across a green residential lawn with a Grow Green service truck parked on the street",
    caption: "Seasonal liquid lawn treatment in progress on a residential property",
    width: 480,
    height: 640,
  },
  "lawn-treatment-truck-hose-front-yard": {
    id: "lawn-treatment-truck-hose-front-yard",
    slug: "lawn-treatment-truck-hose-front-yard",
    alt: "Healthy green front lawn with a yellow treatment hose leading to a service truck at the curb",
    caption: "Front-yard lawn treatment with professional spray equipment",
    width: 480,
    height: 640,
  },
  "residential-backyard-lawn-slope": {
    id: "residential-backyard-lawn-slope",
    slug: "residential-backyard-lawn-slope",
    alt: "Green sloping residential backyard lawn bordered by trees and neighboring homes",
    caption: "Warm-season backyard turf on a residential slope",
    width: 480,
    height: 640,
  },
  "residential-lawn-garden-bed-fountain": {
    id: "residential-lawn-garden-bed-fountain",
    slug: "residential-lawn-garden-bed-fountain",
    alt: "Lush backyard lawn beside a landscaped bed with purple foliage plants and a circular water feature",
    caption: "Residential lawn paired with ornamental beds",
    width: 480,
    height: 640,
  },
  "residential-lawn-shrubs-brick-home": {
    id: "residential-lawn-shrubs-brick-home",
    slug: "residential-lawn-shrubs-brick-home",
    alt: "Thick green lawn along a brick home foundation with a row of upright shrubs",
    caption: "Foundation plantings and treated turf beside a brick home",
    width: 480,
    height: 640,
  },
  "residential-lawn-clean-edge-walkway": {
    id: "residential-lawn-clean-edge-walkway",
    slug: "residential-lawn-clean-edge-walkway",
    alt: "Healthy green residential lawn with a clean edge along a concrete walkway and privacy shrubs",
    caption: "Clean turf edge along a residential walkway",
    width: 480,
    height: 640,
  },
  "residential-backyard-lawn-island-bed": {
    id: "residential-backyard-lawn-island-bed",
    slug: "residential-backyard-lawn-island-bed",
    alt: "Sunny residential backyard with a green lawn and a circular island planting bed",
    caption: "Backyard turf with a central landscape island",
    width: 480,
    height: 640,
  },
  "residential-side-yard-lawn-fence": {
    id: "residential-side-yard-lawn-fence",
    slug: "residential-side-yard-lawn-fence",
    alt: "Narrow green side-yard lawn between a brick wall and a wooden privacy fence",
    caption: "Side-yard warm-season turf between home and fence",
    width: 480,
    height: 640,
  },
  "residential-front-lawn-hedge": {
    id: "residential-front-lawn-hedge",
    slug: "residential-front-lawn-hedge",
    alt: "Deep green front lawn in front of a low evergreen hedge and suburban brick home",
    caption: "Front lawn with a trimmed evergreen hedge",
    width: 480,
    height: 640,
  },
  "residential-front-lawn-curb-appeal": {
    id: "residential-front-lawn-curb-appeal",
    slug: "residential-front-lawn-curb-appeal",
    alt: "Striped green residential front lawn along a driveway in a suburban neighborhood",
    caption: "Healthy residential front lawn with strong curb appeal",
    width: 480,
    height: 640,
  },
  "residential-lawn-sidewalk-edge": {
    id: "residential-lawn-sidewalk-edge",
    slug: "residential-lawn-sidewalk-edge",
    alt: "Lush green lawn meeting a concrete sidewalk with a crisp turf edge",
    caption: "Sidewalk edge detail on a treated residential lawn",
    width: 480,
    height: 640,
  },
  "residential-narrow-side-yard-lawn": {
    id: "residential-narrow-side-yard-lawn",
    slug: "residential-narrow-side-yard-lawn",
    alt: "Long narrow strip of green lawn between a house wall and wooden privacy fence",
    caption: "Narrow side-yard lawn after seasonal care",
    width: 480,
    height: 640,
  },
  "residential-backyard-lawn-poolside": {
    id: "residential-backyard-lawn-poolside",
    slug: "residential-backyard-lawn-poolside",
    alt: "Bright green backyard lawn leading toward a residential swimming pool and patio",
    caption: "Poolside residential lawn with warm-season turf",
    width: 480,
    height: 640,
  },
  "residential-lawn-driveway-edge-beds": {
    id: "residential-lawn-driveway-edge-beds",
    slug: "residential-lawn-driveway-edge-beds",
    alt: "Manicured green lawn and flower bed along a brick home and concrete driveway",
    caption: "Driveway-edge lawn and ornamental bed",
    width: 480,
    height: 640,
  },
};

/** Primary hero + supporting gallery per served parish (visual variety only). */
export const parishMediaByKey: Record<string, ParishMediaSet> = {
  Ascension: {
    parishKey: "Ascension",
    hero: photos["lawn-treatment-truck-hose-street"],
    gallery: [
      photos["residential-front-lawn-hedge"],
      photos["residential-lawn-clean-edge-walkway"],
    ],
  },
  Livingston: {
    parishKey: "Livingston",
    hero: photos["lawn-treatment-truck-hose-front-yard"],
    gallery: [
      photos["residential-front-lawn-curb-appeal"],
      photos["residential-lawn-sidewalk-edge"],
    ],
  },
  "West Baton Rouge": {
    parishKey: "West Baton Rouge",
    hero: photos["residential-backyard-lawn-slope"],
    gallery: [
      photos["residential-side-yard-lawn-fence"],
      photos["residential-lawn-driveway-edge-beds"],
    ],
  },
  Iberville: {
    parishKey: "Iberville",
    hero: photos["residential-front-lawn-hedge"],
    gallery: [
      photos["residential-narrow-side-yard-lawn"],
      photos["residential-backyard-lawn-island-bed"],
    ],
  },
  "East Baton Rouge": {
    parishKey: "East Baton Rouge",
    hero: photos["residential-backyard-lawn-poolside"],
    gallery: [
      photos["lawn-treatment-truck-hose-street"],
      photos["residential-lawn-shrubs-brick-home"],
    ],
  },
  Jefferson: {
    parishKey: "Jefferson",
    hero: photos["residential-lawn-garden-bed-fountain"],
    gallery: [
      photos["residential-lawn-driveway-edge-beds"],
      photos["residential-lawn-clean-edge-walkway"],
    ],
  },
  "St. James": {
    parishKey: "St. James",
    hero: photos["residential-backyard-lawn-island-bed"],
    gallery: [
      photos["residential-side-yard-lawn-fence"],
      photos["residential-front-lawn-curb-appeal"],
    ],
  },
  "St. John the Baptist": {
    parishKey: "St. John the Baptist",
    hero: photos["residential-side-yard-lawn-fence"],
    gallery: [
      photos["residential-narrow-side-yard-lawn"],
      photos["residential-lawn-sidewalk-edge"],
    ],
  },
  "St. Tammany": {
    parishKey: "St. Tammany",
    hero: photos["residential-lawn-sidewalk-edge"],
    gallery: [
      photos["residential-lawn-garden-bed-fountain"],
      photos["residential-backyard-lawn-slope"],
    ],
  },
  Tangipahoa: {
    parishKey: "Tangipahoa",
    hero: photos["residential-lawn-shrubs-brick-home"],
    gallery: [
      photos["lawn-treatment-truck-hose-front-yard"],
      photos["residential-backyard-lawn-poolside"],
    ],
  },
};

export function parishMediaFor(parishKey: string): ParishMediaSet | null {
  return parishMediaByKey[parishKey] ?? null;
}

/** Display file uses -1280 suffix as canonical output name; native pixels are phone-sized (~480). */
export function parishPhotoSrc(photo: ParishPhoto): string {
  return `/images/parishes/${photo.slug}-1280.webp`;
}

export function parishPhotoSrcSet(photo: ParishPhoto): string {
  return `${parishPhotoSrc(photo)} ${photo.width}w`;
}

export function parishPhotoJpg(photo: ParishPhoto): string {
  return `/images/parishes/${photo.slug}-1280.jpg`;
}
