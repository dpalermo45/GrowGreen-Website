import type { APIRoute } from "astro";
import { readCareersConfigFromEnv } from "../../../lib/careers/config";
import { fetchCareerOpenings } from "../../../lib/careers/proxy";

export const prerender = false;

export const GET: APIRoute = async () => {
  const config = readCareersConfigFromEnv();
  try {
    const result = await fetchCareerOpenings(config);
    return json(result, 200);
  } catch {
    return json(
      {
        ok: false,
        error: "Current openings are temporarily unavailable.",
        openings: [],
      },
      503,
    );
  }
};

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
