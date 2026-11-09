/**
 * Curate parish hub photography into public/images/parishes/
 * Run: node scripts/curate-parish-photos.mjs
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const assets =
  "C:/Users/dpale/.cursor/projects/c-Users-dpale-OneDrive-Desktop-GrowGreen-Website/assets";
const outDir = path.join(root, "public/images/parishes");

const jobs = [
  {
    src: "7-fb96f764-e317-421c-9001-339ff13aa3d4.jpg",
    slug: "lawn-treatment-truck-hose-street",
    alt: "Yellow lawn treatment hose across a green residential lawn with a Grow Green service truck parked on the street",
    caption: "Seasonal liquid lawn treatment in progress on a residential property",
  },
  {
    src: "14-65aec2e5-88b4-4231-bfed-f84933f075ed.jpg",
    slug: "lawn-treatment-truck-hose-front-yard",
    alt: "Healthy green front lawn with a yellow treatment hose leading to a service truck at the curb",
    caption: "Front-yard lawn treatment with professional spray equipment",
  },
  {
    src: "4-35de79e0-ce0b-4231-b9f7-dab775d22cdb.jpg",
    slug: "residential-backyard-lawn-slope",
    alt: "Green sloping residential backyard lawn bordered by trees and neighboring homes",
    caption: "Warm-season backyard turf on a residential slope",
  },
  {
    src: "5-e51c4ce3-a144-4f50-9434-296c315091cf.jpg",
    slug: "residential-lawn-garden-bed-fountain",
    alt: "Lush backyard lawn beside a landscaped bed with purple foliage plants and a circular water feature",
    caption: "Residential lawn paired with ornamental beds",
  },
  {
    src: "8-bb273ea8-48b6-438f-85a1-5ca4e218607d.jpg",
    slug: "residential-lawn-shrubs-brick-home",
    alt: "Thick green lawn along a brick home foundation with a row of upright shrubs",
    caption: "Foundation plantings and treated turf beside a brick home",
  },
  {
    src: "3-cbd4140c-3378-44e9-9c9b-0578c66f0bff.jpg",
    slug: "residential-lawn-clean-edge-walkway",
    alt: "Healthy green residential lawn with a clean edge along a concrete walkway and privacy shrubs",
    caption: "Clean turf edge along a residential walkway",
  },
  {
    src: "6-2d9672c4-d54d-4d29-87cc-3fad9aa4b777.jpg",
    slug: "residential-backyard-lawn-island-bed",
    alt: "Sunny residential backyard with a green lawn and a circular island planting bed",
    caption: "Backyard turf with a central landscape island",
  },
  {
    src: "2-2ae97f37-13cb-4394-b061-538b19e764db.jpg",
    slug: "residential-side-yard-lawn-fence",
    alt: "Narrow green side-yard lawn between a brick wall and a wooden privacy fence",
    caption: "Side-yard warm-season turf between home and fence",
  },
  {
    src: "1-3985a738-49ae-4609-b9f2-c52a5fdda946.jpg",
    slug: "residential-front-lawn-hedge",
    alt: "Deep green front lawn in front of a low evergreen hedge and suburban brick home",
    caption: "Front lawn with a trimmed evergreen hedge",
  },
  {
    src: "13-77e7e2be-4feb-46e0-a1ae-838f696521c8.jpg",
    slug: "residential-front-lawn-curb-appeal",
    alt: "Striped green residential front lawn along a driveway in a suburban neighborhood",
    caption: "Healthy residential front lawn with strong curb appeal",
  },
  {
    src: "10-05694931-1677-4b6b-ac6c-7e1a1eeef6c6.jpg",
    slug: "residential-lawn-sidewalk-edge",
    alt: "Lush green lawn meeting a concrete sidewalk with a crisp turf edge",
    caption: "Sidewalk edge detail on a treated residential lawn",
  },
  {
    src: "9-5498f888-f817-4cab-9631-cdf1daf9ebf9.jpg",
    slug: "residential-narrow-side-yard-lawn",
    alt: "Long narrow strip of green lawn between a house wall and wooden privacy fence",
    caption: "Narrow side-yard lawn after seasonal care",
  },
  {
    src: "11-219c9cea-75a1-4e72-852e-1e7efc3b8c64.jpg",
    slug: "residential-backyard-lawn-poolside",
    alt: "Bright green backyard lawn leading toward a residential swimming pool and patio",
    caption: "Poolside residential lawn with warm-season turf",
  },
  {
    src: "12-a62c2150-8f15-4fba-a6df-c0883d080232.jpg",
    slug: "residential-lawn-driveway-edge-beds",
    alt: "Manicured green lawn and flower bed along a brick home and concrete driveway",
    caption: "Driveway-edge lawn and ornamental bed",
  },
];

const widths = [640, 960, 1280];

await fs.mkdir(outDir, { recursive: true });
const manifest = [];

for (const job of jobs) {
  const input = path.join(assets, job.src);
  const base = sharp(input).rotate();
  const meta = await base.metadata();
  const aspect = (meta.height || 3) / (meta.width || 4);

  for (const w of widths) {
    const h = Math.round(w * aspect);
    const webpPath = path.join(outDir, `${job.slug}-${w}.webp`);
    await sharp(input)
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 })
      .toFile(webpPath);
  }

  const jpgPath = path.join(outDir, `${job.slug}-1280.jpg`);
  const jpgInfo = await sharp(input)
    .rotate()
    .resize({ width: 1280, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(jpgPath);

  manifest.push({
    id: job.slug,
    slug: job.slug,
    width: jpgInfo.width,
    height: jpgInfo.height,
    files: {
      w1280: `/images/parishes/${job.slug}-1280.webp`,
      w960: `/images/parishes/${job.slug}-960.webp`,
      w640: `/images/parishes/${job.slug}-640.webp`,
      jpg: `/images/parishes/${job.slug}-1280.jpg`,
    },
    alt: job.alt,
    caption: job.caption,
  });
  console.log("ok", job.slug, `${jpgInfo.width}x${jpgInfo.height}`);
}

await fs.writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Wrote ${manifest.length} photos to ${outDir}`);
