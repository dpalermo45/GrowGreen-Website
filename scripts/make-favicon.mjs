import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Build full-color favicons from the Grow Green logo.
 * Favicon crops to the grass mark so the green brand reads at tab size.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "public/images/brand/logo.png");
const outDir = path.join(root, "public/images/brand");
const out = path.join(outDir, "favicon.png");

const size = 180;
const pad = 16;
const radius = 36;
const bg = { r: 247, g: 251, b: 247, alpha: 1 };
const iconSize = size - pad * 2;

const { data, info } = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const a = data[i + 3];
  if (a < 8) continue;
  if (r < 28 && g < 28 && b < 28) data[i + 3] = 0;
}

const trimmed = await sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .trim({ threshold: 8 })
  .png()
  .toBuffer({ resolveWithObject: true });

/** Prefer the grass tuft (upper portion of the sticker) for tiny tab clarity. */
const cropHeight = Math.round(trimmed.info.height * 0.58);
const mark = await sharp(trimmed.data)
  .extract({
    left: 0,
    top: 0,
    width: trimmed.info.width,
    height: Math.min(cropHeight, trimmed.info.height),
  })
  .resize(iconSize, iconSize, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer({ resolveWithObject: true });

const left = Math.round((size - mark.info.width) / 2);
const top = Math.round((size - mark.info.height) / 2);

const maskSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/></svg>`,
);

const base = await sharp({
  create: { width: size, height: size, channels: 4, background: bg },
})
  .composite([{ input: mark.data, left, top }])
  .png()
  .toBuffer();

await sharp(base)
  .composite([{ input: maskSvg, blend: "dest-in" }])
  .png()
  .toFile(out);

await sharp(out).resize(48, 48).png().toFile(path.join(outDir, "favicon-48.png"));
await sharp(out).resize(32, 32).png().toFile(path.join(outDir, "favicon-32.png"));

console.log(`Wrote ${path.relative(root, out)} (+ 32 / 48) from full-color grass mark`);
