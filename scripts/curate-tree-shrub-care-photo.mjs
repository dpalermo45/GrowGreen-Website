/**
 * Curate owner tree/shrub care action photo into SEO-named responsive assets.
 * Run: node scripts/curate-tree-shrub-care-photo.mjs
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const input = path.join(
  "C:/Users/dpale/.cursor/projects/c-Users-dpale-OneDrive-Desktop-GrowGreen-Website/assets",
  "IMG_1917-3824141a-b8cc-49f3-b826-93797ccd754a.jpg",
);
const outDir = path.join(root, "public/images/services/tree-shrub-care");
const slug = "technician-spraying-ornamental-tree-shrubs";
const alt =
  "Grow Green technician spraying ornamental shrubs and a small tree in a residential landscaped bed";
const caption =
  "Technician applying a tree and shrub treatment to ornamental plants in a residential landscape";

await fs.mkdir(outDir, { recursive: true });

const meta = await sharp(input).rotate().metadata();
console.log("source", meta.width, "x", meta.height);

const widths = [480, 640, 768];
for (const w of widths) {
  const info = await sharp(input)
    .rotate()
    .resize({ width: w, withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(path.join(outDir, `${slug}-${w}.webp`));
  console.log("webp", w, info.width, info.height, info.size);
}

const jpg = await sharp(input)
  .rotate()
  .resize({ width: 768, withoutEnlargement: true })
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(path.join(outDir, `${slug}-768.jpg`));
console.log("jpg", jpg.width, jpg.height, jpg.size);

const card = await sharp(input)
  .rotate()
  .resize({ width: 720, height: 540, fit: "cover", position: "centre" })
  .webp({ quality: 82, effort: 6 })
  .toFile(path.join(outDir, `${slug}-card.webp`));
console.log("card", card.width, card.height, card.size);

const hubCard = path.join(root, "public/images/services/tree-shrub-care-card.webp");
await fs.copyFile(path.join(outDir, `${slug}-card.webp`), hubCard);
console.log("hub card", hubCard);

await fs.writeFile(
  path.join(outDir, "manifest.json"),
  JSON.stringify(
    {
      slug,
      alt,
      caption,
      width: jpg.width,
      height: jpg.height,
      nativeWidth: meta.width,
      nativeHeight: meta.height,
      sources: {
        w480: `/images/services/tree-shrub-care/${slug}-480.webp`,
        w640: `/images/services/tree-shrub-care/${slug}-640.webp`,
        w768: `/images/services/tree-shrub-care/${slug}-768.webp`,
        jpg: `/images/services/tree-shrub-care/${slug}-768.jpg`,
        card: `/images/services/tree-shrub-care/${slug}-card.webp`,
        hubCard: "/images/services/tree-shrub-care-card.webp",
      },
    },
    null,
    2,
  ),
);
console.log("manifest written");
