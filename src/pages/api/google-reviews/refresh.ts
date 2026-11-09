import type { APIRoute } from "astro";
import { readGoogleReviewsConfig } from "../../../lib/google-reviews/config";
import { isCronAuthorized, isSetupAccessAllowed } from "../../../lib/google-reviews/loopback";
import { refreshReviewsCache } from "../../../lib/google-reviews/service";

export const prerender = false;

/**
 * Manual / scheduled refresh. Does not expose tokens.
 * Allowed for loopback setup OR Authorization: Bearer $GOOGLE_REVIEWS_CRON_SECRET.
 */
export const POST: APIRoute = async ({ request, url }) => {
  const config = readGoogleReviewsConfig();
  const allowed =
    isSetupAccessAllowed(request, url, config) || isCronAuthorized(request, config);
  if (!allowed) {
    return new Response(JSON.stringify({ ok: false, code: "forbidden" }), {
      status: 404,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  try {
    const cache = await refreshReviewsCache(config);
    return new Response(
      JSON.stringify({
        ok: true,
        fetchedAt: cache?.fetchedAt ?? null,
        reviewCount: cache?.reviews.length ?? 0,
        averageRating: cache?.averageRating ?? null,
        totalReviewCount: cache?.totalReviewCount ?? null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "refresh_failed";
    // Never include Google response bodies that may contain tokens.
    return new Response(JSON.stringify({ ok: false, code: message }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
};
