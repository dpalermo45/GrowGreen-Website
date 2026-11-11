import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Build favicons from a tight, centered crop of the thumbs-up mascot face.
 * Tall grass spikes dominate a full-head crop at 16px — face fills the icon.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "public/images/mascot/thumbs-up.png");
const outDir = path.join(root, "public/images/brand");
const out = path.join(outDir, "favicon.png");

const size = 180;
const pad = 6;
const radius = 36;
const bg = { r: 247, g: 251, b: 247, alpha: 1 };
const iconSize = size - pad * 2;

const trimmed = await sharp(src)
  .ensureAlpha()
  .trim({ threshold: 8 })
  .png()
  .toBuffer({ resolveWithObject: true });

const w = trimmed.info.width;
const h = trimmed.info.height;

/** Square locked on the face (cuts tall spike tips so eyes sit near center at 16px). */
const cropSize = Math.round(w * 0.38);
const cropLeft = Math.round(w * 0.26);
const cropTop = Math.round(h * 0.135);

const { data, info } = await sharp(trimmed.data)
  .extract({
    left: cropLeft,
    top: cropTop,
    width: Math.min(cropSize, w - cropLeft),
    height: Math.min(cropSize, h - cropTop),
  })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

/** Clear only edge-connected near-black canvas; keep black eyebrows/outlines. */
const { width, height } = info;
const visited = new Uint8Array(width * height);
const stack = [];
const isBg = (i) => {
  const o = i * 4;
  const a = data[o + 3];
  if (a < 8) return true;
  return data[o] < 22 && data[o + 1] < 22 && data[o + 2] < 22;
};
const push = (x, y) => {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const i = y * width + x;
  if (visited[i]) return;
  if (!isBg(i)) return;
  visited[i] = 1;
  stack.push(i);
};
for (let x = 0; x < width; x++) {
  push(x, 0);
  push(x, height - 1);
}
for (let y = 0; y < height; y++) {
  push(0, y);
  push(width - 1, y);
}
while (stack.length) {
  const i = stack.pop();
  data[i * 4 + 3] = 0;
  const x = i % width;
  const y = (i - x) / width;
  push(x + 1, y);
  push(x - 1, y);
  push(x, y + 1);
  push(x, y - 1);
}

const faceCentered = await sharp(data, {
  raw: { width, height, channels: 4 },
})
  .trim({ threshold: 8 })
  .resize(iconSize, iconSize, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer({ resolveWithObject: true });

const left = Math.round((size - faceCentered.info.width) / 2);
const top = Math.round((size - faceCentered.info.height) / 2);

const maskSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/></svg>`,
);

const base = await sharp({
  create: { width: size, height: size, channels: 4, background: bg },
})
  .composite([{ input: faceCentered.data, left, top }])
  .png()
  .toBuffer();

await sharp(base)
  .composite([{ input: maskSvg, blend: "dest-in" }])
  .png()
  .toFile(out);

await sharp(out).resize(48, 48).png().toFile(path.join(outDir, "favicon-48.png"));
await sharp(out).resize(32, 32).png().toFile(path.join(outDir, "favicon-32.png"));

console.log(`Wrote ${path.relative(root, out)} (+ 32 / 48) from centered thumbs-up face`);
