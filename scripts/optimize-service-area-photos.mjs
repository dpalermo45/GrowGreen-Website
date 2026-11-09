/**
 * Re-exports owner pool photos with SEO filenames, correct dims, and
 * compressed webp derivatives (no upscaling beyond source).
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";

const assets =
  "C:/Users/dpale/.cursor/projects/c-Users-dpale-OneDrive-Desktop-GrowGreen-Website/assets";
const out = "C:/Users/dpale/OneDrive/Desktop/GrowGreen-Website/public/images/service-areas";

const TRUCK = new Set([4, 7, 17, 18, 39, 42]);
const PROPERTY = new Set([2, 5, 19, 21, 22, 23, 24, 28, 29, 30, 31, 32, 34]);

function kind(id) {
  if (TRUCK.has(id)) return "service-truck";
  if (PROPERTY.has(id)) return "home-lawn";
  return "lawn-care";
}

const files = fs
  .readdirSync(assets)
  .filter((f) => /^\d+-.*\.jpe?g$/i.test(f))
  .map((f) => ({ f, n: Number(f.split("-")[0]) }))
  .sort((a, b) => a.n - b.n);

const manifest = [];

for (const { f, n } of files) {
  const id = String(n).padStart(2, "0");
  const slug = `grow-green-${kind(n)}-${id}`;
  const input = path.join(assets, f);
  const metaIn = await sharp(input).rotate().metadata();
  const fullPath = path.join(out, `${slug}.webp`);
  const smPath = path.join(out, `${slug}-480.webp`);

  await sharp(input)
    .rotate()
    .webp({ quality: 82, effort: 6 })
    .toFile(fullPath);

  const targetSm = Math.min(480, metaIn.width || 480);
  await sharp(input)
    .rotate()
    .resize(targetSm, null, { withoutEnlargement: true })
    .webp({ quality: 78, effort: 6 })
    .toFile(smPath);

  const meta = await sharp(fullPath).metadata();
  // Keep legacy pool-* names as copies for any stale refs during transition
  const legacy = path.join(out, `pool-${id}.webp`);
  fs.copyFileSync(fullPath, legacy);

  manifest.push({
    id: n,
    kind: kind(n),
    src: `/images/service-areas/${slug}.webp`,
    srcSm: `/images/service-areas/${slug}-480.webp`,
    width: meta.width,
    height: meta.height,
  });
  console.log("ok", slug, `${meta.width}x${meta.height}`);
}

// Prairieville responsive derivatives if missing
const pv = path.join(out, "prairieville.webp");
if (fs.existsSync(pv)) {
  const pvMeta = await sharp(pv).metadata();
  const pv640 = path.join(out, "prairieville-640.webp");
  if (!fs.existsSync(pv640)) {
    await sharp(pv)
      .resize(640, null, { withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 })
      .toFile(pv640);
  }
  manifest.push({
    id: "prairieville",
    kind: "community",
    src: "/images/service-areas/prairieville.webp",
    srcSm: "/images/service-areas/prairieville-640.webp",
    width: pvMeta.width,
    height: pvMeta.height,
  });
}

fs.writeFileSync(path.join(out, "_seo-manifest.json"), JSON.stringify(manifest, null, 2));
console.log("wrote", manifest.length, "entries");
