import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Build favicons from the thumbs-up mascot head.
 * Full-body art is cropped to the face/grass so it stays readable at tab size.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "public/images/mascot/thumbs-up.png");
const outDir = path.join(root, "public/images/brand");
const out = path.join(outDir, "favicon.png");

const size = 180;
const pad = 10;
const radius = 36;
const bg = { r: 247, g: 251, b: 247, alpha: 1 };
const iconSize = size - pad * 2;

const trimmed = await sharp(src)
  .ensureAlpha()
  .trim({ threshold: 8 })
  .png()
  .toBuffer({ resolveWithObject: true });

/** Head + grass spikes; exclude torso so the face reads at 16–32px. */
const headHeight = Math.round(trimmed.info.height * 0.38);
const headTop = 0;
const head = await sharp(trimmed.data)
  .extract({
    left: 0,
    top: headTop,
    width: trimmed.info.width,
    height: Math.min(headHeight, trimmed.info.height),
  })
  .trim({ threshold: 8 })
  .resize(iconSize, iconSize, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer({ resolveWithObject: true });

const left = Math.round((size - head.info.width) / 2);
const top = Math.round((size - head.info.height) / 2);

const maskSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/></svg>`,
);

const base = await sharp({
  create: { width: size, height: size, channels: 4, background: bg },
})
  .composite([{ input: head.data, left, top }])
  .png()
  .toBuffer();

await sharp(base)
  .composite([{ input: maskSvg, blend: "dest-in" }])
  .png()
  .toFile(out);

await sharp(out).resize(48, 48).png().toFile(path.join(outDir, "favicon-48.png"));
await sharp(out).resize(32, 32).png().toFile(path.join(outDir, "favicon-32.png"));

console.log(`Wrote ${path.relative(root, out)} (+ 32 / 48) from thumbs-up mascot head`);
