import type { APIRoute } from "astro";
import { readGoogleReviewsConfig } from "../../../lib/google-reviews/config";
import { isSetupAccessAllowed } from "../../../lib/google-reviews/loopback";
import { disconnectGoogleReviews } from "../../../lib/google-reviews/service";

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  const config = readGoogleReviewsConfig();
  if (!isSetupAccessAllowed(request, url, config)) {
    return new Response("Not found", { status: 404 });
  }

  await disconnectGoogleReviews(config);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
};
