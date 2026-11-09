import fs from "fs";

for (const page of ["home", "service", "quote"]) {
  const r = JSON.parse(fs.readFileSync(`.lighthouse/baseline/${page}-run2.json`, "utf8"));
  const lcp = r.audits["largest-contentful-paint-element"];
  const items = lcp?.details?.items || [];
  const network = (r.audits["network-requests"]?.details?.items || [])
    .sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))
    .slice(0, 15)
    .map((i) => ({
      url: String(i.url).replace("http://127.0.0.1:4321", ""),
      kb: Math.round((i.transferSize || 0) / 1024),
      type: i.resourceType,
    }));
  const opportunities = Object.values(r.audits)
    .filter((a) => a.details?.type === "opportunity" && a.score != null && a.score < 1)
    .map((a) => ({
      id: a.id,
      title: a.title,
      savingsMs: a.details?.overallSavingsMs,
      savingsBytes: a.details?.overallSavingsBytes,
    }))
    .sort((a, b) => (b.savingsMs || 0) - (a.savingsMs || 0))
    .slice(0, 10);

  console.log(`\n==== ${page} ====`);
  console.log("LCP score/value", r.audits["largest-contentful-paint"]?.displayValue);
  console.log("LCP items", JSON.stringify(items, null, 2).slice(0, 2000));
  console.log("Top network", network);
  console.log("Opportunities", opportunities);
  console.log(
    "render-blocking",
    r.audits["render-blocking-resources"]?.details?.items?.map((i) => ({
      url: String(i.url).replace("http://127.0.0.1:4321", ""),
      wastedMs: i.wastedMs,
    })),
  );
  console.log("uses-responsive-images", r.audits["uses-responsive-images"]?.details?.items?.slice(0, 8));
  console.log("offscreen-images", r.audits["offscreen-images"]?.details?.items?.slice(0, 8));
  console.log("unsized-images", r.audits["unsized-images"]?.details?.items?.slice(0, 8));
}
