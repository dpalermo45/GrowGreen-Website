import type { APIRoute } from "astro";
import { checkRateLimit } from "../../../lib/leads/rateLimit";
import { readCrmConfigFromEnv, submitWebsiteLead } from "../../../lib/leads/submit";
import { validateWebsiteLead } from "../../../lib/leads/validate";

export const prerender = false;

function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return json(
      {
        ok: false,
        code: "validation",
        message: "Invalid JSON body.",
        retryable: false,
      },
      400,
    );
  }

  const limited = checkRateLimit(clientIp(request));
  if (!limited.allowed) {
    return json(
      {
        ok: false,
        code: "rate_limit",
        message: "Too many requests. Please wait and try again, or call us.",
        retryable: true,
      },
      429,
      { "Retry-After": String(limited.retryAfterSec) },
    );
  }

  const validated = validateWebsiteLead(body);
  if (!validated.ok) {
    if (validated.code === "honeypot") {
      // Soft-success for bots; no CRM call.
      return json({ ok: true, customer_id: null, ignored: true }, 200);
    }
    return json(
      {
        ok: false,
        code: validated.code,
        message: validated.message,
        retryable: validated.retryable,
      },
      validated.status,
    );
  }

  const config = readCrmConfigFromEnv();
  const result = await submitWebsiteLead(validated.value, config);

  if (!result.ok) {
    return json(
      {
        ok: false,
        code: result.code,
        message: result.message,
        retryable: result.retryable,
      },
      result.status,
    );
  }

  return json(
    {
      ok: true,
      customer_id: result.customer_id,
      mocked: result.mocked === true,
    },
    201,
  );
};

function json(
  data: unknown,
  status: number,
  headers: Record<string, string> = {},
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}
