/**
 * Technician business-card QR landings (`/t/[slug]/`).
 * Attribution is stamped onto CRM leads for referral credit / commission filtering.
 * Add a row here when printing a new tech card — no separate page module required.
 */

export type Technician = {
  slug: string;
  name: string;
  role: string;
  photo: string;
  photoAlt: string;
  /** Short customer-facing pitch on the QR landing. */
  pitch: string;
};

export const technicians: Technician[] = [
  {
    slug: "kyle-robison",
    name: "Kyle Robison",
    role: "Lead Technician",
    photo: "/images/about/kyle-robison.webp",
    photoAlt: "Kyle Robison, lead technician at Grow Green Weed Control",
    pitch:
      "Scan my card for a free lawn estimate. Our St. Amant office will follow up with pricing for your property.",
  },
];

export const technicianBySlug = Object.fromEntries(
  technicians.map((t) => [t.slug, t]),
) as Record<string, Technician>;

/** CRM lead_source — stable string for office filters and commission. */
export function technicianLeadSource(tech: Technician): string {
  return `Technician Card - ${tech.name}`;
}

/** Form `source` / notes Source line (same stable label as lead_source). */
export function technicianFormSource(tech: Technician): string {
  return technicianLeadSource(tech);
}

/** Default UTMs when the printed QR has a clean path (no query string). */
export function technicianAttribution(tech: Technician): {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
} {
  return {
    utm_source: "technician-card",
    utm_medium: "qr",
    utm_campaign: "tech-referral",
    utm_content: tech.slug,
  };
}

/** Extra notes line for office readability + commission matching. */
export function technicianReferralNote(tech: Technician): string {
  return `Referred by technician: ${tech.name}`;
}

export function technicianCanonicalPath(tech: Technician): string {
  return `/t/${tech.slug}/`;
}
