import fs from "fs";

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const rows = [];
  for (const line of lines.slice(1)) {
    const out = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (q && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = !q;
      } else if (c === "," && !q) {
        out.push(cur);
        cur = "";
      } else cur += c;
    }
    out.push(cur);
    rows.push({
      old: out[0],
      status: out[1],
      title: out[3],
      neu: out[7],
      cls: out[8],
      action: out[9],
      pri: out[10],
      conf: out[11],
    });
  }
  return rows;
}

const rows = parseCsv(fs.readFileSync("docs/migration/url-audit.csv", "utf8"));
const strip = (u) => u.replace("https://growgreenweedcontrol.com", "");

console.log("MISSING");
for (const r of rows.filter((r) => r.cls === "MISSING PAGE")) {
  console.log(r.pri, r.status, strip(r.old), "=>", r.neu || "-", "|", r.action);
}
console.log("\nREDIRECT");
for (const r of rows.filter((r) => r.cls === "REDIRECT NEEDED")) {
  console.log(r.pri, strip(r.old), "=>", r.neu, "|", r.action);
}
console.log("\nUNRESOLVED");
for (const r of rows.filter((r) => r.cls === "UNRESOLVED")) {
  console.log(r.status, strip(r.old), r.title);
}
console.log("\nP1 items");
for (const r of rows.filter((r) => r.pri === "P1" && r.cls !== "PRESERVED")) {
  console.log(r.cls, strip(r.old), "=>", r.neu || "-");
}

const j = JSON.parse(fs.readFileSync(".migration-work/new-routes.json", "utf8"));
console.log("\nnew routes", j.count);
const paths = new Set(j.routes.map((r) => r[0]));
for (const p of [
  "/service-areas/prairieville/",
  "/lawn-treatment-service-prairieville-la/",
  "/facebook-estimate-request/",
  "/request-an-estimate-facebook-50/",
  "/gym-member-lawn-care-special/",
]) {
  console.log(p, paths.has(p));
}
