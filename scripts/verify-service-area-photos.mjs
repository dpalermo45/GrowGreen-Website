import { readFileSync } from "fs";

const areasSrc = readFileSync(
  new URL("../src/data/service-areas.ts", import.meta.url),
  "utf8",
);
const cut = areasSrc.indexOf("serviceAreaHubs");
const citySrc = areasSrc.slice(0, cut);
const cities = [...citySrc.matchAll(/^\s+slug:\s*"([^"]+)"/gm)].map((m) => m[1]);
const pool = [
  1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
  29, 30, 31, 32, 34, 35, 36, 37, 38, 39, 40, 41, 42,
];
const others = cities.filter((s) => s !== "prairieville");
console.log(
  JSON.stringify(
    {
      cities: cities.length,
      pool: pool.length,
      others: others.length,
      enoughPrimary: pool.length >= others.length,
    },
    null,
    2,
  ),
);

async function check(path) {
  const res = await fetch(`http://127.0.0.1:4321${path}`);
  const html = await res.text();
  return {
    path,
    status: res.status,
    gallery: html.includes("sa-gallery"),
    pool: /pool-\d+\.webp/.test(html),
    prairieville: html.includes("prairieville.webp"),
  };
}

const samples = await Promise.all([
  check("/service-areas/prairieville/"),
  check("/service-areas/st-amant/"),
  check("/service-areas/baton-rouge/"),
  check("/service-areas/mandeville/"),
  check("/images/service-areas/pool-01.webp"),
  check("/images/service-areas/pool-42.webp"),
]);
console.log(JSON.stringify(samples, null, 2));
