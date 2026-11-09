import type { APIRoute } from "astro";
import { hasOAuthCredentials, readGoogleReviewsConfig } from "../../../../lib/google-reviews/config";
import { isSetupAccessAllowed } from "../../../../lib/google-reviews/loopback";
import { beginOAuth } from "../../../../lib/google-reviews/oauth";

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  const config = readGoogleReviewsConfig();

  if (!isSetupAccessAllowed(request, url, config)) {
    return new Response("Not found", { status: 404 });
  }

  if (!hasOAuthCredentials(config)) {
    return Response.redirect(
      `${config.oauthOrigin}/google-reviews/setup/?step=error&reason=config`,
      302,
    );
  }

  try {
    const { authorizeUrl } = await beginOAuth(config);
    return Response.redirect(authorizeUrl, 302);
  } catch {
    return Response.redirect(
      `${config.oauthOrigin}/google-reviews/setup/?step=error&reason=start_failed`,
      302,
    );
  }
};
