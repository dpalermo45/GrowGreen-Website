import type { APIRoute } from "astro";
import { readGoogleReviewsConfig } from "../../../lib/google-reviews/config";
import { isSetupAccessAllowed } from "../../../lib/google-reviews/loopback";
import { confirmLocationSelection, refreshReviewsCache } from "../../../lib/google-reviews/service";

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  const config = readGoogleReviewsConfig();
  if (!isSetupAccessAllowed(request, url, config)) {
    return new Response("Not found", { status: 404 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, code: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  const accountId = String(body.accountId || "").trim();
  const locationId = String(body.locationId || "").trim();
  const title = String(body.title || "").trim() || locationId;
  const storefrontAddress = body.storefrontAddress
    ? String(body.storefrontAddress)
    : undefined;

  if (!accountId || !locationId) {
    return new Response(JSON.stringify({ ok: false, code: "missing_ids" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  try {
    const selection = await confirmLocationSelection(config, {
      accountId,
      locationId,
      title,
      storefrontAddress,
    });
    // First fetch after explicit owner confirmation — never auto-picked.
    await refreshReviewsCache(config);
    return new Response(JSON.stringify({ ok: true, selection }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : "select_failed";
    return new Response(JSON.stringify({ ok: false, code }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
};
