import { describe, expect, it } from "vitest";
import { serviceAreas } from "../src/data/service-areas";
import {
  assertAllServiceAreaContentPresent,
  getServiceAreaContent,
  nearbyServiceAreas,
} from "../src/data/service-area-content";

describe("service area content", () => {
  it("has unique write-ups for all 40 inventory cities", () => {
    expect(serviceAreas).toHaveLength(40);
    expect(assertAllServiceAreaContentPresent()).toEqual([]);
  });

  it("requires headline, intro, meta, and three sections with paragraphs", () => {
    for (const area of serviceAreas) {
      const content = getServiceAreaContent(area.slug);
      expect(content, area.slug).toBeTruthy();
      expect(content!.headline.length).toBeGreaterThan(10);
      expect(content!.intro.length).toBeGreaterThan(40);
      expect(content!.metaDescription.length).toBeGreaterThan(40);
      expect(content!.sections.length).toBeGreaterThanOrEqual(3);
      for (const section of content!.sections) {
        expect(section.heading.length).toBeGreaterThan(3);
        expect(section.paragraphs.length).toBeGreaterThan(0);
        expect(section.paragraphs.join(" ").length).toBeGreaterThan(80);
      }
      // Photos are optional until upload.
      if (content!.image) {
        expect(content!.image.src).toMatch(/^\/images\/service-areas\//);
        expect(content!.image.alt.length).toBeGreaterThan(8);
      }
    }
  });

  it("resolves nearby areas without self-links", () => {
    const albany = serviceAreas.find((a) => a.slug === "albany")!;
    const nearby = nearbyServiceAreas(albany, 6);
    expect(nearby.every((n) => n.slug !== "albany")).toBe(true);
    expect(nearby.length).toBeGreaterThan(0);
  });
});
