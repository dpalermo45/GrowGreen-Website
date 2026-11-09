import type { APIRoute } from "astro";
import { readGoogleReviewsConfig } from "../../../lib/google-reviews/config";
import { isSetupAccessAllowed } from "../../../lib/google-reviews/loopback";
import { discoverLocations } from "../../../lib/google-reviews/service";

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  const config = readGoogleReviewsConfig();
  if (!isSetupAccessAllowed(request, url, config)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const data = await discoverLocations(config);
    return new Response(JSON.stringify({ ok: true, ...data }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : "discover_failed";
    return new Response(JSON.stringify({ ok: false, code }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
};
