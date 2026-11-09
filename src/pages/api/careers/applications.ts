import type { APIRoute } from "astro";
import { checkRateLimit } from "../../../lib/leads/rateLimit";
import { readCareersConfigFromEnv } from "../../../lib/careers/config";
import { forwardCareerApplication } from "../../../lib/careers/proxy";

export const prerender = false;

function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

const TEXT_FIELDS = [
  "job_opening_slug",
  "first_name",
  "last_name",
  "email",
  "phone",
  "city",
  "state",
  "zip",
  "earliest_start_date",
  "availability",
  "work_authorized",
  "sponsorship_required",
  "experience_summary",
  "why_good_fit",
  "valid_drivers_license",
  "insurable_driving_record",
  "can_perform_essential_functions",
  "referral_source",
  "referral_employee_name",
  "additional_notes",
  "sms_opt_in",
  "sms_consent_language",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "page_url",
  "referrer",
  "device_info",
  "idempotency_key",
  "website",
] as const;

/**
 * Careers applications stay OFF customer lead intake.
 * Browser posts JSON (optional base64 résumé) to avoid Astro multipart origin checks;
 * server rebuilds FormData for the CRM public careers applications API.
 */
export const POST: APIRoute = async ({ request }) => {
  const limited = checkRateLimit(`careers:${clientIp(request)}`, 5, 600_000);
  if (!limited.allowed) {
    return json(
      {
        ok: false,
        error:
          "Too many applications were submitted from this connection. Please wait about 15 minutes and try again.",
      },
      429,
      { "Retry-After": String(limited.retryAfterSec) },
    );
  }

  let formData: FormData;
  try {
    formData = await parseApplicationBody(request);
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Invalid application body.",
      },
      400,
    );
  }

  if (String(formData.get("website") || "").trim()) {
    return json({ ok: true, ignored: true }, 200);
  }

  const config = readCareersConfigFromEnv();

  try {
    const result = await forwardCareerApplication(config, formData);
    return json(result.body, result.status);
  } catch (error) {
    const aborted =
      error instanceof Error &&
      (error.name === "AbortError" || /aborted/i.test(error.message));
    return json(
      {
        ok: false,
        error: aborted
          ? "The submission took too long. Your information is still here—please try again."
          : "We could not reach the hiring system. Check your connection and try again.",
      },
      aborted ? 504 : 502,
    );
  }
};

async function parseApplicationBody(request: Request): Promise<FormData> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    return request.formData();
  }

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    const formData = new FormData();

    for (const key of TEXT_FIELDS) {
      const value = body[key];
      if (value == null || value === "") continue;
      formData.set(key, String(value));
    }

    const resume = body.resume;
    if (resume && typeof resume === "object") {
      const file = resume as { name?: string; type?: string; data_base64?: string };
      if (file.data_base64 && file.name) {
        const bytes = Uint8Array.from(atob(file.data_base64), (c) => c.charCodeAt(0));
        if (bytes.byteLength > 10 * 1024 * 1024) {
          throw new Error("Your résumé must be 10 MB or smaller.");
        }
        const blob = new Blob([bytes], {
          type: file.type || "application/octet-stream",
        });
        formData.set("resume", blob, file.name);
      }
    }

    return formData;
  }

  throw new Error("Unsupported content type. Send JSON or multipart form data.");
}

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
