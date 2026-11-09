import type { APIRoute } from "astro";

export const prerender = false;

/**
 * Legacy JSON careers endpoint retired.
 * Applications now use multipart POST /api/careers/applications/
 * (CRM public careers API — never customer lead intake).
 */
export const POST: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      ok: false,
      error:
        "This careers endpoint has been updated. Please refresh the careers page and submit again.",
      applications_path: "/api/careers/applications/",
    }),
    {
      status: 410,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  );
};
