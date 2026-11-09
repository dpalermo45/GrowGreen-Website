/**
 * One-shot helper: emit dedicated service page entrypoints so Astro CSS splits.
 */
import fs from "node:fs";
import path from "node:path";

const pages = [
  {
    file: "lawn-fertilization-weed-control.astro",
    component: "LawnFertilizationPage",
    slug: "lawn-fertilization-weed-control",
    useServiceMeta: true,
    preload: "/images/home/hero-lawn-640.webp",
  },
  {
    file: "core-aeration.astro",
    component: "CoreAerationPage",
    slug: "core-aeration",
    title: "Core Aeration | Grow Green Weed Control – Compacted Soil Relief",
    description:
      "Professional core aeration for South Louisiana lawns. Open compacted soil so air, water, and nutrients reach the root zone. Free local estimate.",
    preload: "/images/services/core-aeration-hero-800.webp",
  },
  {
    file: "liquid-aeration.astro",
    component: "LiquidAerationPage",
    slug: "liquid-aeration",
    title: "Liquid Aeration | Grow Green Weed Control – Soil Conditioning Without Plugs",
    description:
      "Liquid aeration for South Louisiana lawns—soil-conditioning support for better wetting and water movement without cores or holes. Free local estimate from a firefighter-owned team.",
    preload: "/images/services/liquid-aeration-hero-800.webp",
  },
  {
    file: "tree-and-shrub-care.astro",
    component: "TreeShrubCarePage",
    slug: "tree-and-shrub-care",
    title: "Tree & Shrub Care | Grow Green Weed Control – Seasonal Ornamental Program",
    description:
      "Six-visit tree and shrub care for South Louisiana landscapes—seasonal monitoring, targeted pest and disease management, and plant nutrition. Free local estimate.",
    preload: "/images/services/tree-shrub-hero-800.webp",
  },
  {
    file: "fire-ant-treatment.astro",
    component: "FireAntTreatmentPage",
    slug: "fire-ant-treatment",
    title: "Fire Ant Treatment | Grow Green Weed Control – Colony-Focused Control",
    description:
      "Professional fire ant control for South Louisiana lawns. Colony-focused treatment that goes beyond knocking down visible mounds. Free local estimate.",
    preload: "/images/services/ant-mound-960.webp",
  },
  {
    file: "flower-bed-weed-control-and-fertilization.astro",
    component: "FlowerBedWeedControlPage",
    slug: "flower-bed-weed-control-and-fertilization",
    title: "Flower Bed Weed Control & Fertilization | Grow Green Weed Control",
    description:
      "Professional flower bed weed control, pre-emergent prevention, and optional fertilization for mulch, rock, and landscaped beds in South Louisiana. Free local estimate.",
    preload: "/images/services/flower-beds/front-bed-pine-straw-white-home-960.webp",
  },
  {
    file: "mosquito-flea-tick-treatments.astro",
    component: "MosquitoFleaTickPage",
    slug: "mosquito-flea-tick-treatments",
    title: "Mosquito, Flea & Tick Treatments | Grow Green Weed Control",
    description:
      "Professional outdoor mosquito, flea, and tick treatments for South Louisiana yards. Warm-season plans and one-time event options. Free local estimate.",
    preload: "/images/services/mosquito-960.webp",
  },
  {
    file: "soil-sample.astro",
    component: "SoilSamplePage",
    slug: "soil-sample",
    title: "Soil Sampling & pH Balance | Grow Green Weed Control",
    description:
      "Professional $55 lawn soil sample with lab analysis, graphic report, and plain-English recommendations for South Louisiana turf. Request a soil test.",
    preload: "/images/services/soil-sampling-960.webp",
  },
  {
    file: "lawn-fungus-and-insects.astro",
    component: "LawnFungusInsectsPage",
    slug: "lawn-fungus-and-insects",
    title: "Lawn Fungus and Insect Treatments | Grow Green Weed Control",
    description:
      "Evaluation-first lawn fungus and insect treatments for South Louisiana turf. Separate disease from insects and look-alikes, then get the right response.",
    preload: "/images/services/lawn-fungus-hero-800.webp",
  },
  {
    file: "lawn-fungus.astro",
    component: "LawnFungusPage",
    slug: "lawn-fungus",
    title: "Lawn Fungus Treatment | Grow Green Weed Control – Fungicide & Lawn Disease Control",
    description:
      "Protect your lawn from brown patch, dollar spot, and other turf diseases with professional lawn fungus evaluation and treatment from Grow Green Weed Control. Serving South Louisiana.",
    preload: "/images/services/lawn-fungus-hero-800.webp",
  },
  {
    file: "lawn-insects.astro",
    component: "LawnInsectsPage",
    slug: "lawn-insects",
    title: "Lawn Insect Control | Grow Green Weed Control – Chinch Bugs, Armyworms & More",
    description:
      "Targeted lawn insect evaluation and treatment for chinch bugs, armyworms, sod webworms, and mole crickets in South Louisiana. Evidence first—then the right response.",
    preload: "/images/services/lawn-insects-hero-800.webp",
  },
];

const outDir = path.resolve("src/pages");

for (const p of pages) {
  const body = p.useServiceMeta
    ? `---
import BaseLayout from "../layouts/BaseLayout.astro";
import ${p.component} from "../components/${p.component}.astro";
import { serviceBySlug } from "../data/services";

export const prerender = true;

const service = serviceBySlug["${p.slug}"];
if (!service) throw new Error("Missing service ${p.slug}");
---

<BaseLayout
  title={\`\${service.title} | Grow Green Weed Control\`}
  description={service.summary}
  canonicalPath="/${p.slug}/"
>
  <link slot="head" rel="preload" as="image" href="${p.preload}" fetchpriority="high" />
  <${p.component} />
</BaseLayout>
`
    : `---
import BaseLayout from "../layouts/BaseLayout.astro";
import ${p.component} from "../components/${p.component}.astro";

export const prerender = true;
---

<BaseLayout
  title=${JSON.stringify(p.title)}
  description=${JSON.stringify(p.description)}
  canonicalPath="/${p.slug}/"
>
  <link slot="head" rel="preload" as="image" href="${p.preload}" fetchpriority="high" />
  <${p.component} />
</BaseLayout>
`;

  fs.writeFileSync(path.join(outDir, p.file), body);
  console.log("wrote", p.file);
}

console.log("dedicated service pages:", pages.length);
