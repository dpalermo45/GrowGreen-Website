import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  LA_MAPBOX_BBOX,
  LA_MAPBOX_PROXIMITY,
} from "../src/lib/geo/louisianaMapboxBias";

const ROOT = resolve(import.meta.dirname, "..");

const FORM_SOURCES = [
  "src/components/QuoteForm.astro",
  "src/components/RequestQuotePage.astro",
  "src/components/FacebookNovemberLanding.astro",
] as const;

function readSrc(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

describe("louisianaMapboxBias shared constants", () => {
  it("keeps South Louisiana proximity + bbox values", () => {
    expect(LA_MAPBOX_PROXIMITY).toBe("-91.05,30.35");
    expect(LA_MAPBOX_BBOX).toBe("-92.25,29.40,-89.35,31.65");
  });
});

describe("all website address forms use shared LA Mapbox bias", () => {
  for (const rel of FORM_SOURCES) {
    it(`${rel} imports shared constants and wires data-mapbox-proximity/bbox`, () => {
      const source = readSrc(rel);
      expect(source).toContain("louisianaMapboxBias");
      expect(source).toContain("LA_MAPBOX_PROXIMITY");
      expect(source).toContain("LA_MAPBOX_BBOX");
      expect(source).toContain("data-mapbox-proximity={LA_MAPBOX_PROXIMITY}");
      expect(source).toContain("data-mapbox-bbox={LA_MAPBOX_BBOX}");
    });
  }

  it("QuoteForm does not call Mapbox with only country/types/limit (Ohio-ranking bug)", () => {
    const source = readSrc("src/components/QuoteForm.astro");
    expect(source).not.toMatch(
      /mapbox\.places\/\$\{[^}]+\}\.json\?access_token=\$\{[^}]+\}&country=US&types=address&limit=5/,
    );
    expect(source).toMatch(/proximity:\s*laProximity/);
    expect(source).toMatch(/bbox:\s*laBbox/);
  });
});
