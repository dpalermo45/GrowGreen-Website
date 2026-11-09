/**
 * Replace legacy flower-bed service photos with owner bed photography.
 * Run: node scripts/curate-flower-bed-photos.mjs
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const assets =
  "C:/Users/dpale/.cursor/projects/c-Users-dpale-OneDrive-Desktop-GrowGreen-Website/assets";
const outDir = path.join(root, "public/images/services/flower-beds");
const legacyGlobDir = path.join(root, "public/images/services");

const jobs = [
  {
    src: "beds1-0b8707ad-35b3-4f8a-90e3-ecbc99ab042d.jpg",
    slug: "mulched-bed-crepe-myrtle-brick-home",
    alt: "Freshly mulched residential flower bed with a crepe myrtle and evergreen shrubs along a brick home",
    caption: "Mulched bed with crepe myrtle and foundation shrubs",
  },
  {
    src: "beds2-edabc0c6-744d-456a-851e-c82bccaeda54.jpg",
    slug: "curved-bed-white-flowers-driveway",
    alt: "Curved residential flower bed filled with white flowering plants beside a green lawn and driveway",
    caption: "Curved bed with dense white seasonal flowers",
  },
  {
    src: "beds_3-9ff09bc9-86c1-4a89-84ef-00eb29bcd085.jpg",
    slug: "pine-straw-bed-crape-myrtle-mailbox",
    alt: "Pine-straw landscaped bed with pink crape myrtle blooms, purple groundcover, and a mailbox at the sidewalk",
    caption: "Pine-straw bed with flowering crape myrtles",
  },
  {
    src: "beds4-7667d03a-d0b2-4b60-8c31-90b1a70a118d.jpg",
    slug: "front-bed-pine-straw-white-home",
    alt: "Curved pine-straw flower bed with shrubs and flowers in front of a white residential home",
    caption: "Front-yard bed with pine straw and layered shrubs",
  },
  {
    src: "beds5-4ed9d3dc-767e-42b5-b598-4f0dbf12822d.jpg",
    slug: "mulched-hedge-bed-lawn-treatment-sign",
    alt: "Clean mulched flower bed with a trimmed hedge and Grow Green lawn treatment yard sign in the front turf",
    caption: "Maintained hedge bed with Grow Green yard sign",
  },
  {
    src: "beds6-a1d77781-9209-4573-a245-a95ceb1eef8d.jpg",
    slug: "front-bed-hedge-edge-white-brick",
    alt: "Residential flower bed with reddish mulch, flowering plants, and a low hedge edge beside a white brick home",
    caption: "Hedge-edged bed with seasonal plantings",
  },
];

await fs.mkdir(outDir, { recursive: true });

/** Remove legacy flower-bed.* assets completely. */
const legacy = await fs.readdir(legacyGlobDir);
for (const name of legacy) {
  if (/^flower-bed(\.|-)/i.test(name)) {
    await fs.unlink(path.join(legacyGlobDir, name));
    console.log("removed legacy", name);
  }
}

const manifest = [];
const widths = [480, 640, 960];

for (const job of jobs) {
  const input = path.join(assets, job.src);
  const meta = await sharp(input).rotate().metadata();
  const aspect = (meta.height || 4) / (meta.width || 3);

  for (const w of widths) {
    await sharp(input)
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 82, effort: 6 })
      .toFile(path.join(outDir, `${job.slug}-${w}.webp`));
  }

  const jpg = await sharp(input)
    .rotate()
    .resize({ width: 960, withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(outDir, `${job.slug}-960.jpg`));

  // Card/thumb convenience copy used by homepage/services hubs
  await sharp(input)
    .rotate()
    .resize({ width: 640, height: 480, fit: "cover", position: "centre", withoutEnlargement: false })
    .webp({ quality: 82, effort: 6 })
    .toFile(path.join(outDir, `${job.slug}-card.webp`));

  manifest.push({
    id: job.slug,
    slug: job.slug,
    width: jpg.width,
    height: jpg.height,
    nativeWidth: meta.width,
    nativeHeight: meta.height,
    files: {
      w480: `/images/services/flower-beds/${job.slug}-480.webp`,
      w640: `/images/services/flower-beds/${job.slug}-640.webp`,
      w960: `/images/services/flower-beds/${job.slug}-960.webp`,
      jpg: `/images/services/flower-beds/${job.slug}-960.jpg`,
      card: `/images/services/flower-beds/${job.slug}-card.webp`,
    },
    alt: job.alt,
    caption: job.caption,
  });
  console.log("ok", job.slug, `${jpg.width}x${jpg.height}`, `src ${meta.width}x${meta.height}`);
}

await fs.writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

// Keep a stable path for shared card usage after deleting legacy flower-bed.webp
const primaryCard = path.join(outDir, "mulched-hedge-bed-lawn-treatment-sign-card.webp");
const sharedCard = path.join(legacyGlobDir, "flower-bed-card.webp");
await fs.copyFile(primaryCard, sharedCard);
console.log("wrote shared card", sharedCard);
console.log(`Wrote ${manifest.length} flower-bed photos`);
