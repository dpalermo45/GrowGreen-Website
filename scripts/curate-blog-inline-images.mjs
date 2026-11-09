#!/usr/bin/env node
/**
 * Curate original WordPress blog inline images into public/images/blog/inline/
 * without wiping the rest of public/images (unlike media:curate).
 *
 * Usage: node scripts/curate-blog-inline-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const UPLOADS = path.join(ROOT, "website-media", "uploads");
const OUT = path.join(ROOT, "public", "images", "blog", "inline");
const DATA_OUT = path.join(ROOT, "src", "data", "blog-inline-images.ts");

/**
 * Prefer full-size / scaled originals over WP resized filenames.
 * @type {Array<{
 *   slug: string,
 *   id: string,
 *   source: string,
 *   alt: string,
 *   afterHeading?: string,
 * }>}
 */
const IMAGES = [
  // —— Insects ——
  {
    slug: "common-lawn-insects-in-prairieville",
    id: "insect-damage",
    source: "wpfc-backup/2022/12/Insect-Damage-in-Lawns--scaled.jpg",
    alt: "Lawn insect damage in Prairieville, LA",
    afterHeading: "Do You Have Brown Spots",
  },
  {
    slug: "common-lawn-insects-in-prairieville",
    id: "chinch-damage",
    source: "wpfc-backup/2022/12/ChinchDamage.png",
    alt: "Chinch bug damage in a Prairieville lawn",
    afterHeading: "Chinch Bugs",
  },
  {
    slug: "common-lawn-insects-in-prairieville",
    id: "army-worms",
    source: "wpfc-backup/2022/12/army-worms.jpg",
    alt: "Army worms on a Prairieville lawn",
    afterHeading: "Army Worms",
  },
  {
    slug: "common-lawn-insects-in-prairieville",
    id: "sod-webworm",
    source: "wpfc-backup/2022/12/sod-webworm-moth-1.png",
    alt: "Sod webworm moth related to lawn damage in Prairieville, LA",
  },

  // —— Centipede ——
  {
    slug: "creating-a-thriving-centipede-lawn-in-baton-rouge-louisiana",
    id: "centipede-stolon",
    source: "wpfc-backup/2022/12/centipede-stolon.jpg",
    alt: "Centipedegrass stolon close-up in Baton Rouge",
    afterHeading: "What is Centipede",
  },
  {
    slug: "creating-a-thriving-centipede-lawn-in-baton-rouge-louisiana",
    id: "centipede-well-maintained",
    source: "wpfc-backup/2022/12/centipede-well-maintained.jpg",
    alt: "Well-maintained centipede lawn in Baton Rouge, LA",
    afterHeading: "Advantages",
  },
  {
    slug: "creating-a-thriving-centipede-lawn-in-baton-rouge-louisiana",
    id: "centipede-fungus",
    source: "wpfc-backup/2022/12/centipede-fungus.jpg",
    alt: "Fungus damage on a centipede lawn in Baton Rouge",
  },
  {
    slug: "creating-a-thriving-centipede-lawn-in-baton-rouge-louisiana",
    id: "centipede-sod",
    source: "wpfc-backup/2022/12/centipede-sod.jpg",
    alt: "Centipede sod in Baton Rouge",
  },

  // —— Burweed / pickers ——
  {
    slug: "how-to-kill-pickers-stickers-burweed-in-louisiana",
    id: "burweed-closeup",
    source: "wpfc-backup/2022/12/burweed-louisiana-scaled.jpg",
    alt: "Close-up of low-growing lawn burweed in a Louisiana lawn",
    afterHeading: "Identify Lawn Burweed",
  },
  {
    slug: "how-to-kill-pickers-stickers-burweed-in-louisiana",
    id: "simazine",
    source: "wpfc-backup/2022/12/simazine.jpg",
    alt: "Herbicide product used as part of a professional lawn burweed program",
    afterHeading: "Ways to Kill",
  },
  {
    slug: "how-to-kill-pickers-stickers-burweed-in-louisiana",
    id: "pickers-baton-rouge",
    source: "wpfc-backup/2022/12/pickers-baton-rouge.jpg",
    alt: "Sharp stickers produced by mature lawn burweed in Baton Rouge",
    afterHeading: "What to look for",
  },
  {
    slug: "how-to-kill-pickers-stickers-burweed-in-louisiana",
    id: "owner-thumb",
    source: "2025/10/video_thumb_00_01.jpg",
    alt: "Dereck Palermo, owner of Grow Green Weed Control",
    afterHeading: "Want help",
  },

  // —— Large patch ——
  {
    slug: "battling-large-patch-disease-a-guide-to-protecting-your-baton-rouge-lawn",
    id: "large-patch-fungus",
    source: "wpfc-backup/2022/12/centipede-fungus.jpg",
    alt: "Large patch / brown patch symptoms on centipede turf",
    afterHeading: "Large Patch",
  },
  {
    slug: "battling-large-patch-disease-a-guide-to-protecting-your-baton-rouge-lawn",
    id: "eagle-product",
    source: "wpfc-backup/2023/12/eagle.png",
    alt: "Fungicide product used in professional large patch treatment programs",
  },

  // —— Fertilizing guide ——
  {
    slug: "the-ultimate-guide-to-fertilizing-your-lawn-in-south-louisiana",
    id: "solu95",
    source: "2024/02/solu95.jpg",
    alt: "Lawn fertilizer used in Baton Rouge area programs",
    afterHeading: "Lawn Fertilization",
  },
  {
    slug: "the-ultimate-guide-to-fertilizing-your-lawn-in-south-louisiana",
    id: "lawn-fert",
    source: "wpfc-backup/2021/07/lawn-fert.jpg",
    alt: "Lawn fertilization application",
  },
  {
    slug: "the-ultimate-guide-to-fertilizing-your-lawn-in-south-louisiana",
    id: "ryegrass",
    source: "2024/02/Ryegrass.jpg",
    alt: "Winter ryegrass related to cool-season fertilizer timing",
    afterHeading: "Climate of South Louisiana",
  },

  // —— Dallisgrass ——
  {
    slug: "battling-dallis-grass-the-challenge-of-eliminating-a-stubborn-weed-in-warm-season-grasses",
    id: "dallis-grass",
    source: "2024/05/dallis-grass-2.jpg",
    alt: "Dallisgrass close-up in a Louisiana lawn",
    afterHeading: "Meet the Foe",
  },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function loadSharp() {
  try {
    const mod = await import("sharp");
    return mod.default;
  } catch {
    return null;
  }
}

function writeDataModule(shipped) {
  const bySlug = {};
  for (const item of shipped) {
    if (!bySlug[item.slug]) bySlug[item.slug] = [];
    bySlug[item.slug].push({
      src: `/images/blog/inline/${item.id}.webp`,
      fallback: `/images/blog/inline/${item.id}${path.extname(item.source).toLowerCase() === ".png" ? ".png" : ".jpg"}`,
      alt: item.alt,
      ...(item.afterHeading ? { afterHeading: item.afterHeading } : {}),
    });
  }

  const body = `/**
 * Inline article images restored from the original WordPress blog posts.
 * Generated by scripts/curate-blog-inline-images.mjs — re-run after changing sources.
 */

export type BlogInlineImage = {
  src: string;
  fallback: string;
  alt: string;
  /** Place after a rich-body heading containing this substring (case-insensitive). */
  afterHeading?: string;
};

export const blogInlineImages: Record<string, BlogInlineImage[]> = ${JSON.stringify(bySlug, null, 2)};

export function inlineImagesFor(slug: string): BlogInlineImage[] {
  return blogInlineImages[slug] || [];
}
`;
  fs.writeFileSync(DATA_OUT, body, "utf8");
}

async function main() {
  ensureDir(OUT);
  const sharp = await loadSharp();
  if (!sharp) {
    console.warn("sharp not available — copying originals only (no webp).");
  }

  const shipped = [];
  for (const item of IMAGES) {
    const srcPath = path.join(UPLOADS, item.source);
    if (!fs.existsSync(srcPath)) {
      console.warn(`SKIP missing ${item.id}: ${item.source}`);
      continue;
    }

    const ext = path.extname(item.source).toLowerCase() === ".png" ? ".png" : ".jpg";
    const destOriginal = path.join(OUT, `${item.id}${ext}`);
    fs.copyFileSync(srcPath, destOriginal);
    console.log(`copied ${item.source} → blog/inline/${item.id}${ext}`);

    if (sharp) {
      const destWebp = path.join(OUT, `${item.id}.webp`);
      await sharp(srcPath)
        .rotate()
        .resize({ width: 960, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(destWebp);
      console.log(`  + ${item.id}.webp`);
    } else {
      // Point src at the copied original when webp is unavailable
      const fallbackOnly = {
        ...item,
        // patched below in write via checking file existence
      };
      void fallbackOnly;
    }

    shipped.push(item);
  }

  // If sharp missing, rewrite module to use jpg/png as src
  if (!sharp) {
    const bySlug = {};
    for (const item of shipped) {
      if (!bySlug[item.slug]) bySlug[item.slug] = [];
      const ext = path.extname(item.source).toLowerCase() === ".png" ? ".png" : ".jpg";
      bySlug[item.slug].push({
        src: `/images/blog/inline/${item.id}${ext}`,
        fallback: `/images/blog/inline/${item.id}${ext}`,
        alt: item.alt,
        ...(item.afterHeading ? { afterHeading: item.afterHeading } : {}),
      });
    }
    const body = `/**
 * Inline article images restored from the original WordPress blog posts.
 * Generated by scripts/curate-blog-inline-images.mjs — re-run after changing sources.
 */

export type BlogInlineImage = {
  src: string;
  fallback: string;
  alt: string;
  afterHeading?: string;
};

export const blogInlineImages: Record<string, BlogInlineImage[]> = ${JSON.stringify(bySlug, null, 2)};

export function inlineImagesFor(slug: string): BlogInlineImage[] {
  return blogInlineImages[slug] || [];
}
`;
    fs.writeFileSync(DATA_OUT, body, "utf8");
  } else {
    writeDataModule(shipped);
  }

  console.log(`\nDone. Shipped ${shipped.length}/${IMAGES.length} inline blog images.`);
  console.log(`Wrote ${path.relative(ROOT, DATA_OUT)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
