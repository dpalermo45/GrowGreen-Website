import type { APIRoute } from "astro";
import { readGoogleReviewsConfig } from "../../../lib/google-reviews/config";
import { getDisplayReviews } from "../../../lib/google-reviews/service";

export const prerender = false;

/** Public, non-secret review display payload (cached). Safe for browser fetch. */
export const GET: APIRoute = async () => {
  const config = readGoogleReviewsConfig();
  try {
    const payload = await getDisplayReviews(config);
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({
        ok: true,
        available: false,
        averageRating: null,
        totalReviewCount: null,
        order: "updateTime desc",
        reviews: [],
        googleProfileUrl: config.googleProfileUrl,
        fetchedAt: null,
        cacheExpiresAt: null,
        sampleNote:
          "Showing a recent sample of Google reviews (most recently updated first). This is not the complete review set.",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
};
