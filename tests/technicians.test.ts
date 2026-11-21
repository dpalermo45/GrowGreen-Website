import { describe, expect, it } from "vitest";
import {
  technicians,
  technicianBySlug,
  technicianLeadSource,
  technicianFormSource,
  technicianAttribution,
  technicianReferralNote,
  technicianCanonicalPath,
} from "../src/data/technicians";
import { mapWebsiteLeadToCrm } from "../src/lib/leads/map";

describe("technician QR attribution", () => {
  it("includes Kyle Robison as the seed technician", () => {
    expect(technicians.some((t) => t.slug === "kyle-robison")).toBe(true);
    expect(technicianBySlug["kyle-robison"]?.name).toBe("Kyle Robison");
  });

  it("builds stable lead_source, UTMs, referral note, and path for Kyle", () => {
    const kyle = technicianBySlug["kyle-robison"]!;
    expect(technicianLeadSource(kyle)).toBe("Technician Card - Kyle Robison");
    expect(technicianFormSource(kyle)).toBe("Technician Card - Kyle Robison");
    expect(technicianAttribution(kyle)).toEqual({
      utm_source: "technician-card",
      utm_medium: "qr",
      utm_campaign: "tech-referral",
      utm_content: "kyle-robison",
    });
    expect(technicianReferralNote(kyle)).toBe("Referred by technician: Kyle Robison");
    expect(technicianCanonicalPath(kyle)).toBe("/t/kyle-robison/");
  });

  it("maps a tech-card lead with commission-filterable CRM fields", () => {
    const kyle = technicianBySlug["kyle-robison"]!;
    const attribution = technicianAttribution(kyle);
    const payload = mapWebsiteLeadToCrm({
      name: "Jane Homeowner",
      email: "jane@example.com",
      phone: "(225) 555-0100",
      address: "123 Main St",
      city: "Gonzales",
      zip: "70737",
      lead_source: technicianLeadSource(kyle),
      source: technicianFormSource(kyle),
      notes: technicianReferralNote(kyle),
      page_url: "https://growgreenweedcontrol.com/t/kyle-robison/",
      ...attribution,
    });

    expect(payload.lead_source).toBe("Technician Card - Kyle Robison");
    expect(payload.utm_source).toBe("technician-card");
    expect(payload.utm_medium).toBe("qr");
    expect(payload.utm_campaign).toBe("tech-referral");
    expect(payload.utm_content).toBe("kyle-robison");
    expect(payload.notes).toContain("Source: Technician Card - Kyle Robison");
    expect(payload.notes).toContain("Referred by technician: Kyle Robison");
    expect(payload.event_source_url).toContain("/t/kyle-robison/");
  });
});
