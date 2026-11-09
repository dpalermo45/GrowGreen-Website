import type { APIRoute } from "astro";
import { readGoogleReviewsConfig } from "../../../lib/google-reviews/config";
import { isSetupAccessAllowed } from "../../../lib/google-reviews/loopback";
import { completeOAuthCallback, OAuthCallbackError } from "../../../lib/google-reviews/oauth";

export const prerender = false;

/**
 * Exact registered redirect URI (no trailing slash in Google Console):
 * http://localhost:4321/api/google-reviews/callback
 *
 * Astro may serve `/callback/` as well; token exchange always uses env redirect URI.
 */
export const GET: APIRoute = async ({ request, url }) => {
  const config = readGoogleReviewsConfig();
  const origin = config.oauthOrigin;

  if (!isSetupAccessAllowed(request, url, config)) {
    return new Response("Not found", { status: 404 });
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  try {
    await completeOAuthCallback(config, { code, state, error });
    return Response.redirect(`${origin}/google-reviews/setup/?step=select`, 302);
  } catch (err) {
    const codeName = err instanceof OAuthCallbackError ? err.code : "token_exchange";
    // Never include secrets, codes, or token payloads in the redirect.
    return Response.redirect(
      `${origin}/google-reviews/setup/?step=error&reason=${encodeURIComponent(codeName)}`,
      302,
    );
  }
};
