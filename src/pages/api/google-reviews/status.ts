import type { APIRoute } from "astro";
import { readGoogleReviewsConfig } from "../../../lib/google-reviews/config";
import { isSetupAccessAllowed } from "../../../lib/google-reviews/loopback";
import { getConnectionStatus } from "../../../lib/google-reviews/service";

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  const config = readGoogleReviewsConfig();
  if (!isSetupAccessAllowed(request, url, config)) {
    return new Response("Not found", { status: 404 });
  }

  const status = await getConnectionStatus(config);
  return new Response(
    JSON.stringify({
      ok: true,
      ...status,
      redirectUri: config.redirectUri,
      // Never include client secret or tokens.
      clientIdConfigured: Boolean(config.clientId),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    },
  );
};
