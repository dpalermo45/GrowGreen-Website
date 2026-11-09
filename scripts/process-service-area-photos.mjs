import sharp from "sharp";
import fs from "fs";
import path from "path";

const assets =
  "C:/Users/dpale/.cursor/projects/c-Users-dpale-OneDrive-Desktop-GrowGreen-Website/assets";
const out = "C:/Users/dpale/OneDrive/Desktop/GrowGreen-Website/public/images/service-areas";
fs.mkdirSync(out, { recursive: true });

const files = fs
  .readdirSync(assets)
  .filter((f) => /^\d+-.*\.jpe?g$/i.test(f))
  .map((f) => ({ f, n: Number(f.split("-")[0]) }))
  .sort((a, b) => a.n - b.n);

const manifest = [];
for (const { f, n } of files) {
  const id = String(n).padStart(2, "0");
  const base = `pool-${id}`;
  const input = path.join(assets, f);
  const full = path.join(out, `${base}.webp`);
  const sm = path.join(out, `${base}-640.webp`);
  await sharp(input)
    .rotate()
    .resize(1600, 1200, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(full);
  await sharp(input)
    .rotate()
    .resize(640, 480, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(sm);
  const meta = await sharp(full).metadata();
  manifest.push({
    id: n,
    src: `/images/service-areas/${base}.webp`,
    width: meta.width,
    height: meta.height,
  });
  console.log("ok", base);
}

fs.writeFileSync(path.join(out, "_pool-manifest.json"), JSON.stringify(manifest, null, 2));
console.log("total", manifest.length);
