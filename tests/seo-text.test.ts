import { describe, expect, it } from "vitest";
import { normalizeSeoText } from "../src/lib/seoText";

describe("normalizeSeoText", () => {
  it("decodes double-escaped ampersands", () => {
    expect(normalizeSeoText("Tips &amp;amp; Weed Control")).toBe("Tips & Weed Control");
    expect(normalizeSeoText("Weed &amp; Pest")).toBe("Weed & Pest");
  });

  it("preserves unicode en dashes from JSON escapes", () => {
    expect(normalizeSeoText("Control \u2013 Local")).toBe("Control \u2013 Local");
  });

  it("repairs common mojibake en dashes", () => {
    expect(normalizeSeoText("Control â€“ Local")).toBe("Control \u2013 Local");
  });

  it("returns empty for nullish", () => {
    expect(normalizeSeoText(null)).toBe("");
    expect(normalizeSeoText(undefined)).toBe("");
  });
});
