#!/usr/bin/env node
/**
 * Curate originals from website-media/uploads into public/images/,
 * then generate responsive webp/avif (+ width variants) with sharp when available.
 * Logos keep PNG transparency. Raw uploads stay gitignored.
 *
 * Usage: node scripts/curate-media.mjs
 *    or: npm run media:curate
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const UPLOADS = path.join(ROOT, "website-media", "uploads");
const OUT = path.join(ROOT, "public", "images");
const WIDTHS = [640, 960, 1280, 1920];

/** @typedef {{ id: string, source: string, dest: string, alt: string, use: string, preserveTransparency?: boolean, generateVariants?: boolean }} CuratedImage */

/** @type {CuratedImage[]} */
const CATALOG = [
  // —— Logos (PNG transparency) ——
  {
    id: "logo-primary",
    source: "2026/11/Logo-Full-Glow-TransparentBackground.png",
    dest: "logos/grow-green-logo.png",
    alt: "Grow Green Weed Control logo",
    use: "Current Full-Glow brand mark (nav, footer, OG). Prefer over 2021 assets.",
    preserveTransparency: true,
  },
  {
    id: "logo-legacy-2021",
    source: "2021/07/Grow-Green-Logo.png",
    dest: "logos/grow-green-logo-2021.png",
    alt: "Grow Green Weed Control logo (2021)",
    use: "Archival only — superseded by 2026 Full-Glow. Do not use in chrome.",
    preserveTransparency: true,
  },
  {
    id: "logo-com",
    source: "2021/07/comlogo.png",
    dest: "logos/comlogo.png",
    alt: "Grow Green Weed Control circular logo",
    use: "Compact mark / favicon source / small brand lockups.",
    preserveTransparency: true,
  },
  {
    id: "logo-words",
    source: "2021/07/logo-words-only.png",
    dest: "logos/logo-words-only.png",
    alt: "Grow Green Weed Control wordmark (early)",
    use: "Archival first-iteration wordmark only — never header/footer chrome.",
    preserveTransparency: true,
  },
  {
    id: "logo-com-black",
    source: "2021/07/comlogoblack.png",
    dest: "logos/comlogo-black.png",
    alt: "Grow Green Weed Control logo (dark)",
    use: "Dark-surface / light-background inverse when needed.",
    preserveTransparency: true,
  },

  // —— Mascot (original art, no redraw) ——
  {
    id: "mascot",
    source: "2022/12/grow-green-mascot.png",
    dest: "mascot/grow-green-mascot.png",
    alt: "Grow Green Weed Control cartoon grass mascot",
    use: "Brand personality accents; not a substitute for photo hero.",
    preserveTransparency: true,
  },
  {
    id: "mascot-sprayer",
    source: "2025/11/grow-green-weed-control-mascot-sprayer-nozzle.png",
    dest: "mascot/mascot-sprayer-nozzle.png",
    alt: "Grow Green mascot with sprayer nozzle",
    use: "Service/treatment section accents.",
    preserveTransparency: true,
  },

  // —— Hero / atmospheric photos (prefer 2024–2026) ——
  {
    id: "hero-truck-trailer",
    source: "2025/12/grow-green-truck-and-trailer.jpg",
    dest: "hero/truck-and-trailer.jpg",
    alt: "Grow Green Weed Control truck and trailer",
    use: "Primary homepage / brand hero candidate (authentic fleet).",
  },
  {
    id: "hero-f250",
    source: "2026/11/F250-2018-Pickup-Truck-Side-View.jpg",
    dest: "hero/f250-side-view.jpg",
    alt: "Grow Green Weed Control pickup truck side view",
    use: "Alternate truck hero / campaign trucklead imagery.",
  },
  {
    id: "hero-cover",
    source: "2025/10/Grow-Green-Weed-Control-Cover.jpg",
    dest: "hero/cover.jpg",
    alt: "Grow Green Weed Control lawn care cover photo",
    use: "Full-bleed hero or OG image candidate.",
  },
  {
    id: "hero-lawn-month",
    source: "2026/11/Grow-green-lawn-of-the-month.jpg",
    dest: "hero/lawn-of-the-month.jpg",
    alt: "Healthy treated lawn — Grow Green lawn of the month",
    use: "Lawn results hero (do not invent a city label).",
  },
  {
    id: "hero-lawn-results",
    source: "2025/11/lawn-weed-control-results-gonzales-la-grow-green-weed-control.jpg",
    dest: "hero/lawn-results.jpg",
    alt: "Lawn weed control results in Gonzales, LA by Grow Green Weed Control",
    use: "Results / services hero; city label supported by WP attachment title.",
  },
  {
    id: "hero-treatment-sign",
    source: "2024/12/lawn-treatment-advertisement-sign.jpg",
    dest: "hero/lawn-treatment-sign.jpg",
    alt: "Grow Green lawn treatment yard sign",
    use: "Treatment-in-progress / local service atmosphere.",
  },
  {
    id: "hero-winter-lawn",
    source: "2024/12/winter-pic.png",
    dest: "hero/winter-lawn.png",
    alt: "South Louisiana lawn during cooler season",
    use: "Seasonal lawn atmosphere (generic; no invented city).",
  },
  {
    id: "hero-ascension-lawn",
    source: "2024/12/fertilizer-and-weed-control-ascension-parish.png",
    dest: "hero/ascension-parish-lawn.png",
    alt: "Fertilizer and weed control lawn in Ascension Parish",
    use: "Parish/area pages where Ascension is supported by WP.",
  },

  // —— About / people ——
  {
    id: "about-owner",
    source: "2026/04/grow-green-weed-control-family-owned-company-owner-with-his-son-scaled.jpg",
    dest: "about/owner-with-son.jpg",
    alt: "Grow Green Weed Control owner Dereck Palermo with his son",
    use: "About page / family-owned storytelling (WP alt text).",
  },
  {
    id: "about-kyle-tree",
    source: "2026/04/kyle-tree-shrub-care-baton-rouge-grow-green-weed-control-scaled.jpg",
    dest: "about/kyle-tree-shrub-care.jpg",
    alt: "Grow Green technician providing tree and shrub care in Baton Rouge",
    use: "Tree & shrub / team imagery (WP-supported location).",
  },

  // —— Service detail ——
  {
    id: "service-core-aeration",
    source: "2024/12/core-aeration.jpg",
    dest: "services/core-aeration.jpg",
    alt: "Core aeration plugs on a lawn",
    use: "Core aeration service page.",
  },
  {
    id: "service-ant-mound",
    source: "2024/12/ant-mound.jpg",
    dest: "services/ant-mound.jpg",
    alt: "Fire ant mound in a lawn",
    use: "Fire ant treatment page.",
  },
  // Flower-bed service photos: owner set via `node scripts/curate-flower-bed-photos.mjs`
  // (legacy WP flower-bed.jpg / ladder removed — do not reintroduce).
  {
    id: "service-soil-sample",
    source: "2024/12/winfieldunited_soilsamplingmicronuteints.jpg",
    dest: "services/soil-sampling.jpg",
    alt: "Soil sampling and micronutrient analysis",
    use: "Soil sample service page.",
  },
  {
    id: "service-mosquito",
    source: "2024/12/Mosquito-insect-feeding-on-human-culex-pipiens.jpg",
    dest: "services/mosquito.jpg",
    alt: "Mosquito on skin",
    use: "Mosquito / flea / tick treatments page (pest context).",
  },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function rimrafContents(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fs.rmSync(p, { recursive: true, force: true });
    } else {
      fs.unlinkSync(p);
    }
  }
}

function copyOriginal(item) {
  const src = path.join(UPLOADS, item.source);
  const dest = path.join(OUT, item.dest);
  if (!fs.existsSync(src)) {
    return { ok: false, reason: `missing source: ${item.source}` };
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return { ok: true, dest };
}

async function loadSharp() {
  try {
    return (await import("sharp")).default;
  } catch {
    return null;
  }
}

/**
 * @param {import('sharp').Sharp} sharp
 * @param {CuratedImage} item
 */
async function generateVariants(sharp, item) {
  const original = path.join(OUT, item.dest);
  const baseDir = path.dirname(original);
  const stem = path.basename(original, path.extname(original));
  const meta = await sharp(original).metadata();
  const srcWidth = meta.width || 1920;
  const isLogo = Boolean(item.preserveTransparency);
  const widths = WIDTHS.filter((w) => w <= srcWidth + 32);
  if (!widths.length) widths.push(Math.min(srcWidth, 640));
  const uniqueWidths = [...new Set(widths)];

  const outputs = [];
  for (const width of uniqueWidths) {
    const pipeline = sharp(original).rotate().resize({
      width,
      withoutEnlargement: true,
    });

    if (isLogo) {
      const pngOut = path.join(baseDir, `${stem}-${width}.png`);
      await pipeline.clone().png().toFile(pngOut);
      outputs.push(path.relative(OUT, pngOut).replace(/\\/g, "/"));

      const webpOut = path.join(baseDir, `${stem}-${width}.webp`);
      await pipeline
        .clone()
        .webp({ quality: 90, alphaQuality: 100 })
        .toFile(webpOut);
      outputs.push(path.relative(OUT, webpOut).replace(/\\/g, "/"));
    } else {
      const webpOut = path.join(baseDir, `${stem}-${width}.webp`);
      await pipeline.clone().webp({ quality: 82 }).toFile(webpOut);
      outputs.push(path.relative(OUT, webpOut).replace(/\\/g, "/"));

      const avifOut = path.join(baseDir, `${stem}-${width}.avif`);
      await pipeline.clone().avif({ quality: 55 }).toFile(avifOut);
      outputs.push(path.relative(OUT, avifOut).replace(/\\/g, "/"));
    }
  }

  if (isLogo) {
    const webpFull = path.join(baseDir, `${stem}.webp`);
    await sharp(original).webp({ quality: 90, alphaQuality: 100 }).toFile(webpFull);
    outputs.push(path.relative(OUT, webpFull).replace(/\\/g, "/"));
  } else {
    const webpFull = path.join(baseDir, `${stem}.webp`);
    const avifFull = path.join(baseDir, `${stem}.avif`);
    await sharp(original).webp({ quality: 82 }).toFile(webpFull);
    await sharp(original).avif({ quality: 55 }).toFile(avifFull);
    outputs.push(path.relative(OUT, webpFull).replace(/\\/g, "/"));
    outputs.push(path.relative(OUT, avifFull).replace(/\\/g, "/"));
  }

  return outputs;
}

function writeImageCatalog(results) {
  const docsDir = path.join(ROOT, "docs");
  ensureDir(docsDir);
  const lines = [
    "# Image catalog (shipped)",
    "",
    "Curated originals live under `public/images/`. Raw WordPress uploads remain in `website-media/uploads` (gitignored) and must not be committed.",
    "",
    "Generated by `npm run media:curate` (`scripts/curate-media.mjs`).",
    "",
    "| ID | Public path | Source | Alt text | Recommended use | Status |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  for (const row of results) {
    const publicPath = `/images/${row.dest}`;
    const source = `website-media/uploads/${row.source}`;
    const status = row.ok
      ? row.variants?.length
        ? `ok (${1 + row.variants.length} files)`
        : "ok (original only)"
      : `MISSING — ${row.reason}`;
    lines.push(
      `| \`${row.id}\` | \`${publicPath}\` | \`${source}\` | ${row.alt} | ${row.use} | ${status} |`,
    );
  }

  lines.push(
    "",
    "## Notes",
    "",
    "- Prefer authentic truck / lawn / people photos over stock.",
    "- Do not invent city labels in alt text unless the WP attachment title or page supports them.",
    "- Mascot and logos: use originals; do not redraw or distort.",
    "- Responsive files: `{name}-{640|960|1280|1920}.webp` (and `.avif` for photos; `.png` width variants for logos).",
    "",
  );

  fs.writeFileSync(path.join(docsDir, "image-catalog.md"), lines.join("\n"), "utf8");

  fs.writeFileSync(
    path.join(docsDir, "image-catalog.generated.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        items: results.map((r) => ({
          id: r.id,
          dest: r.dest,
          source: r.source,
          alt: r.alt,
          use: r.use,
          ok: r.ok,
          reason: r.reason,
          variants: r.variants,
        })),
      },
      null,
      2,
    ),
  );
}

function writePhotoReplacementDoc() {
  const dest = path.join(ROOT, "docs", "photo-replacement.md");
  const body = `# Adding or replacing photos

## Quick path

1. Drop the new original into \`website-media/uploads/YYYY/MM/\` (or keep it elsewhere temporarily).
2. Add a row to the \`CATALOG\` array in \`scripts/curate-media.mjs\` with:
   - \`id\` — stable key for docs/code
   - \`source\` — path relative to \`website-media/uploads/\`
   - \`dest\` — path relative to \`public/images/\`
   - \`alt\` — accurate alt text (no invented cities, employees, or results)
   - \`use\` — where the image should appear
   - \`preserveTransparency: true\` for PNG logos/mascot
3. Run \`npm run media:curate\`.
4. Commit **only** files under \`public/images/\` and the updated docs — never raw \`website-media/\` uploads.

## Rules

- Prefer recent authentic photos (trucks, lawns, treatments, team) over stock or AI fills.
- Do not redraw logos or the mascot.
- Do not invent testimonials, employee names, or city-labeled lawn photos without WP/source support.
- Keep hero imagery full-bleed capable; avoid putting unverified review stars or “600+ lawns” into image overlays.

## Without sharp

If \`sharp\` is not installed, the script still copies originals with \`fs.copyFileSync\` so \`public/images\` is usable. Install deps (\`npm install\`) and re-run to generate webp/avif width variants.

## Referencing in pages

Use the public path, e.g. \`/images/hero/truck-and-trailer.jpg\`, or a width variant such as \`/images/hero/truck-and-trailer-1280.webp\`. Prefer \`<picture>\` with avif/webp when variants exist.
`;
  fs.writeFileSync(dest, body, "utf8");
}

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) n += countFiles(p);
    else n += 1;
  }
  return n;
}

async function main() {
  ensureDir(OUT);
  // Replace prior curated tree so we do not mix two curation schemas
  rimrafContents(OUT);

  const sharp = await loadSharp();
  if (!sharp) {
    console.warn(
      "sharp not available — copying originals only. Run npm install then re-run for webp/avif.",
    );
  } else {
    console.log("sharp loaded — generating webp/avif (+ width variants)");
  }

  /** @type {Array<CuratedImage & { ok: boolean, reason?: string, variants?: string[] }>} */
  const results = [];
  let shippedOriginals = 0;
  let missing = 0;

  for (const item of CATALOG) {
    const copy = copyOriginal(item);
    if (!copy.ok) {
      console.warn(`SKIP ${item.id}: ${copy.reason}`);
      missing += 1;
      results.push({ ...item, ok: false, reason: copy.reason });
      continue;
    }
    shippedOriginals += 1;
    console.log(`copied ${item.source} → public/images/${item.dest}`);

    let variants = [];
    if (sharp && item.generateVariants !== false) {
      try {
        variants = await generateVariants(sharp, item);
        console.log(`  + ${variants.length} derivatives`);
      } catch (err) {
        console.warn(`  variant error for ${item.id}:`, err.message || err);
      }
    }
    results.push({ ...item, ok: true, variants });
  }

  // Convenience aliases used by early scaffold
  const aliasPairs = [
    ["hero/truck-and-trailer.jpg", "hero/lawn-hero.jpg"],
    ["logos/grow-green-logo.png", "brand/logo.png"],
    ["logos/comlogo.png", "brand/logo-mark.png"],
    ["logos/logo-words-only.png", "brand/logo-words.png"],
    // favicon.png is generated separately (white mark on forest green) via scripts/make-favicon.mjs
    ["about/owner-with-son.jpg", "about/owner-family.jpg"],
    ["mascot/grow-green-mascot.png", "mascot/mascot-1.png"],
  ];
  for (const [fromRel, toRel] of aliasPairs) {
    const from = path.join(OUT, fromRel);
    const to = path.join(OUT, toRel);
    if (fs.existsSync(from)) {
      ensureDir(path.dirname(to));
      fs.copyFileSync(from, to);
    }
  }

  writeImageCatalog(results);
  writePhotoReplacementDoc();

  const totalFiles = countFiles(OUT);
  console.log(
    `\nDone. Originals shipped: ${shippedOriginals}/${CATALOG.length}; missing: ${missing}; files under public/images: ${totalFiles}`,
  );
  console.log("Wrote docs/image-catalog.md and docs/photo-replacement.md");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
