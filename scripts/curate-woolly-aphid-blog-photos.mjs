/**
 * Curate owner woolly-aphid / crepe myrtle photos for the blog post.
 * Run: node scripts/curate-woolly-aphid-blog-photos.mjs
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const assets = path.join(
  "C:/Users/dpale/.cursor/projects/c-Users-dpale-OneDrive-Desktop-GrowGreen-Website/assets",
);
const outInline = path.join(root, "public/images/blog/inline");
const outBlog = path.join(root, "public/images/blog");
const postSlug = "woolly-aphids-on-crepe-myrtle-baton-rouge";

const shots = [
  {
    file: "IMG_1585-32f88a9b-4e3e-4c69-8870-dac6f0a2920c.jpg",
    stem: "woolly-aphid-crepe-myrtle-bark",
    hero: true,
    position: "centre",
  },
  {
    file: "IMG_1584-f48ad9f4-3732-4600-8506-b36f0fac1ce2.jpg",
    stem: "woolly-aphid-black-sooty-mold-crepe-myrtle",
    hero: false,
    position: "centre",
  },
  {
    file: "IMG_1586-a2a618a8-0946-4c93-a5de-7bf43a8740c4.jpg",
    stem: "crepe-myrtle-after-tree-shrub-treatment",
    hero: false,
    position: "attention",
  },
];

await fs.mkdir(outInline, { recursive: true });
await fs.mkdir(outBlog, { recursive: true });

for (const shot of shots) {
  const input = path.join(assets, shot.file);
  const meta = await sharp(input).rotate().metadata();
  console.log(shot.stem, "source", meta.width, "x", meta.height);

  const webp = await sharp(input)
    .rotate()
    .resize({ width: 960, withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(path.join(outInline, `${shot.stem}.webp`));
  console.log("  inline webp", webp.width, webp.height, webp.size);

  const jpg = await sharp(input)
    .rotate()
    .resize({ width: 960, withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(outInline, `${shot.stem}.jpg`));
  console.log("  inline jpg", jpg.width, jpg.height, jpg.size);

  if (shot.hero) {
    const hero = await sharp(input)
      .rotate()
      .resize({ width: 640, height: 400, fit: "cover", position: shot.position })
      .webp({ quality: 82, effort: 6 })
      .toFile(path.join(outBlog, `${postSlug}-640.webp`));
    console.log("  hero", hero.width, hero.height, hero.size);
  }
}

console.log("done");
