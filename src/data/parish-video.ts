import { site } from "./site";

/**
 * Shared trust-ad video for selected parish hubs.
 * Captions are burnt into the MP4 (no separate VTT required).
 * Page-level VideoObject name/description/embedUrl stay parish-specific for SEO.
 */

export const PARISH_TRUST_VIDEO = {
  src: "/videos/grow-green-trust-ad.mp4",
  poster: "/images/parishes/grow-green-trust-ad-poster.webp",
  width: 720,
  height: 900,
  durationIso: "PT51S",
  durationLabel: "About 51 seconds",
  uploadDate: "2026-11-10",
  encodingFormat: "video/mp4",
  contentUrl: "https://growgreenweedcontrol.com/videos/grow-green-trust-ad.mp4",
  thumbnailUrl: "https://growgreenweedcontrol.com/images/parishes/grow-green-trust-ad-poster.webp",
  /** Reconstructed from burnt-in captions for accessibility + VideoObject.transcript */
  transcript:
    "Hey, I'm Dereck with Grow Green Weed Control, and we're a local company right here in South Louisiana. And we're servicing St. Tammany Parish and many other parishes near Baton Rouge. And we are specialized in lawn treatment, so that's pretty much all we do. We know your turf type. We know what your soil and what your turf needs. And our program typically consists of about eight applications. We always recommend that we pull a soil sample first, so we know what your lawn and your soil specifically needs. And we'd love to have your business, and our number is 225-461-3199.",
} as const;

export type ParishVideoSeo = {
  parishKey: string;
  /** Fragment id used for embedUrl / WatchAction */
  sectionId: string;
  kicker: string;
  title: string;
  lead: string;
  points: string[];
  videoTitle: string;
  ariaLabel: string;
  schemaName: string;
  schemaDescription: string;
  ctaLabel: string;
};

const byParish: Record<string, ParishVideoSeo> = {
  "St. Tammany": {
    parishKey: "St. Tammany",
    sectionId: "parish-video",
    kicker: "Meet Grow Green",
    title: "Local lawn care for St. Tammany Parish homeowners",
    lead:
      "Watch owner Dereck explain how Grow Green serves St. Tammany Parish and nearby South Louisiana communities with lawn treatment—not mowing—built around local turf, soil, and warm-season timing.",
    points: [
      "Mentions St. Tammany Parish coverage by name",
      `${PARISH_TRUST_VIDEO.durationLabel} (captions are already burned into the video)`,
      "Shown in the original 4:5 social format—no crop",
    ],
    videoTitle: "Grow Green Weed Control — local lawn care for St. Tammany Parish",
    ariaLabel:
      "Grow Green owner Dereck introducing firefighter-owned lawn fertilization and weed control for St. Tammany Parish and South Louisiana",
    schemaName: "Lawn Treatments in St. Tammany Parish | Grow Green Weed Control",
    schemaDescription:
      "Dereck from Grow Green Weed Control introduces the local South Louisiana lawn-treatment company, including service in St. Tammany Parish and nearby parishes, warm-season turf know-how, soil sampling, and how to request an estimate at (225) 461-3199.",
    ctaLabel: "Request your St. Tammany Parish estimate →",
  },
  Tangipahoa: {
    parishKey: "Tangipahoa",
    sectionId: "parish-video",
    kicker: "Meet Grow Green",
    title: "Local lawn care for Tangipahoa Parish homeowners",
    lead:
      "Watch owner Dereck explain Grow Green’s South Louisiana lawn-treatment approach—the same local team that serves Hammond, Ponchatoula, and Tangipahoa Parish with fertilization and weed control, not mowing.",
    points: [
      "South Louisiana coverage with parish-level lawn programs",
      `${PARISH_TRUST_VIDEO.durationLabel} (captions are already burned into the video)`,
      "Shown in the original 4:5 social format—no crop",
    ],
    videoTitle: "Grow Green Weed Control — local lawn care for Tangipahoa Parish",
    ariaLabel:
      "Grow Green owner Dereck introducing firefighter-owned lawn fertilization and weed control for Tangipahoa Parish and South Louisiana",
    schemaName: "Lawn Treatments in Tangipahoa Parish | Grow Green Weed Control",
    schemaDescription:
      "Dereck from Grow Green Weed Control introduces the local South Louisiana lawn-treatment company serving Tangipahoa Parish communities such as Hammond and Ponchatoula, with warm-season turf know-how, soil sampling, and estimates at (225) 461-3199.",
    ctaLabel: "Request your Tangipahoa Parish estimate →",
  },
  Jefferson: {
    parishKey: "Jefferson",
    sectionId: "parish-video",
    kicker: "Meet Grow Green",
    title: "Local lawn care for Jefferson Parish homeowners",
    lead:
      "Watch owner Dereck explain Grow Green’s South Louisiana lawn-treatment approach—the same local team that serves Metairie, Kenner, and Jefferson Parish with fertilization and weed control, not mowing.",
    points: [
      "South Louisiana coverage with parish-level lawn programs",
      `${PARISH_TRUST_VIDEO.durationLabel} (captions are already burned into the video)`,
      "Shown in the original 4:5 social format—no crop",
    ],
    videoTitle: "Grow Green Weed Control — local lawn care for Jefferson Parish",
    ariaLabel:
      "Grow Green owner Dereck introducing firefighter-owned lawn fertilization and weed control for Jefferson Parish and South Louisiana",
    schemaName: "Lawn Treatments in Jefferson Parish | Grow Green Weed Control",
    schemaDescription:
      "Dereck from Grow Green Weed Control introduces the local South Louisiana lawn-treatment company serving Jefferson Parish communities such as Metairie and Kenner, with warm-season turf know-how, soil sampling, and estimates at (225) 461-3199.",
    ctaLabel: "Request your Jefferson Parish estimate →",
  },
};

export function parishVideoFor(parishKey: string): ParishVideoSeo | null {
  return byParish[parishKey] ?? null;
}

export function parishTrustVideoSchema(
  seo: ParishVideoSeo,
  pagePath: string,
): Record<string, unknown> {
  const path = pagePath.endsWith("/") ? pagePath : `${pagePath}/`;
  const pageUrl = `https://growgreenweedcontrol.com${path}`;
  const embedUrl = `${pageUrl}#${seo.sectionId}`;
  const objectId = `${pageUrl}#${seo.sectionId}-object`;

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": objectId,
    name: seo.schemaName,
    description: seo.schemaDescription,
    thumbnailUrl: [PARISH_TRUST_VIDEO.thumbnailUrl],
    uploadDate: PARISH_TRUST_VIDEO.uploadDate,
    duration: PARISH_TRUST_VIDEO.durationIso,
    contentUrl: PARISH_TRUST_VIDEO.contentUrl,
    embedUrl,
    transcript: PARISH_TRUST_VIDEO.transcript,
    encodingFormat: PARISH_TRUST_VIDEO.encodingFormat,
    width: PARISH_TRUST_VIDEO.width,
    height: PARISH_TRUST_VIDEO.height,
    inLanguage: "en-US",
    isFamilyFriendly: true,
    regionsAllowed: "US",
    publisher: {
      "@type": "Organization",
      name: site.name,
      logo: {
        "@type": "ImageObject",
        url: "https://growgreenweedcontrol.com/images/brand/logo.png",
      },
    },
    potentialAction: {
      "@type": "WatchAction",
      target: embedUrl,
    },
    about: {
      "@type": "Service",
      name: `Lawn fertilization and weed control in ${seo.parishKey} Parish`,
      provider: {
        "@type": "LocalBusiness",
        name: site.name,
        telephone: site.phoneTel,
        url: "https://growgreenweedcontrol.com/",
      },
      areaServed: {
        "@type": "AdministrativeArea",
        name: `${seo.parishKey} Parish, Louisiana`,
      },
    },
  };
}
