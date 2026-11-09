import type { CareersConfig } from "./config";
import { mockCareerOpenings } from "./mock";
import type { CareerOpening, CareersOpeningsResponse } from "./types";

function openingList(payload: unknown): CareerOpening[] {
  if (Array.isArray(payload)) return payload as CareerOpening[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.openings)) return obj.openings as CareerOpening[];
    if (Array.isArray(obj.results)) return obj.results as CareerOpening[];
  }
  return [];
}

export async function fetchCareerOpenings(
  config: CareersConfig,
): Promise<CareersOpeningsResponse> {
  if (config.mode === "mock") {
    return { ok: true, openings: mockCareerOpenings, mocked: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(config.openingsUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Openings returned ${response.status}`);
    }
    const payload = await response.json();
    const openings = openingList(payload).filter(
      (opening) => opening && opening.slug && opening.title,
    );
    return { ok: true, openings, mocked: false };
  } finally {
    clearTimeout(timer);
  }
}

export async function forwardCareerApplication(
  config: CareersConfig,
  formData: FormData,
): Promise<{ status: number; body: Record<string, unknown> }> {
  if (config.mode === "mock") {
    const honeypot = String(formData.get("website") || "").trim();
    if (honeypot) {
      return { status: 200, body: { ok: true, ignored: true, mocked: true } };
    }

    const required = [
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
    ];
    const field_errors: Record<string, string> = {};
    for (const key of required) {
      if (!String(formData.get(key) || "").trim()) {
        field_errors[key] = "This field is required.";
      }
    }
    if (Object.keys(field_errors).length) {
      return {
        status: 400,
        body: { ok: false, error: "Please correct the highlighted fields.", field_errors },
      };
    }

    console.info("[careers] mock application accepted (not CRM lead)", {
      job: String(formData.get("job_opening_slug") || ""),
      email: String(formData.get("email") || ""),
      resume: formData.get("resume") instanceof File ? (formData.get("resume") as File).name : "",
    });

    return {
      status: 201,
      body: {
        ok: true,
        mocked: true,
        message: "Application received in mock mode (CRM careers API not called).",
      },
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35_000);

  try {
    const response = await fetch(config.applicationsUrl, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: formData,
      signal: controller.signal,
    });
    const text = await response.text();
    let body: Record<string, unknown> = {};
    try {
      body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      body = {};
    }
    return { status: response.status, body };
  } finally {
    clearTimeout(timer);
  }
}
