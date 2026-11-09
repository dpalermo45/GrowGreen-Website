import { mapWebsiteLeadToCrm } from "./map";
import type { LeadResult, WebsiteLeadInput } from "./types";

export type CrmConfig = {
  mode: "mock" | "live";
  baseUrl: string;
  apiKey: string;
  /** Injected for tests */
  fetchImpl?: typeof fetch;
  mockScenario?:
    | "success"
    | "null_customer"
    | "reject"
    | "timeout"
    | "malformed"
    | "http200_empty";
};

export function readCrmConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): CrmConfig {
  const mode = env.GGWC_CRM_MODE === "live" ? "live" : "mock";
  return {
    mode,
    baseUrl: (env.GGWC_CRM_BASE_URL || "").trim(),
    apiKey: (env.GGWC_CRM_API_KEY || "").trim(),
    mockScenario: (env.GGWC_CRM_MOCK_SCENARIO as CrmConfig["mockScenario"]) || "success",
  };
}

function stableIdempotencyKey(input: WebsiteLeadInput): string {
  if (input.idempotency_key?.trim()) return input.idempotency_key.trim();
  // Stable-ish fallback from content + minute bucket to limit accidental dupes
  const bucket = Math.floor(Date.now() / 60_000);
  return `ggwc-${bucket}-${Buffer.from(
    `${input.email}|${input.phone}|${input.address}|${input.zip}`,
  )
    .toString("base64url")
    .slice(0, 32)}`;
}

async function mockCrm(
  scenario: CrmConfig["mockScenario"],
): Promise<{ status: number; body: unknown; timedOut?: boolean }> {
  switch (scenario) {
    case "null_customer":
      return { status: 201, body: { customer: { id: null } } };
    case "reject":
      return { status: 422, body: { error: "CRM rejected the lead." } };
    case "timeout":
      return { status: 0, body: null, timedOut: true };
    case "malformed":
      return { status: 201, body: { ok: true } };
    case "http200_empty":
      return { status: 200, body: {} };
    case "success":
    default:
      return { status: 201, body: { customer: { id: "mock-customer-1001" } } };
  }
}

/**
 * Documented acceptance (website-side contract until CRM docs are complete):
 * - Upstream HTTP status < 400
 * - JSON body includes customer.id that is non-null / non-empty
 * Bare HTTP 200 with empty/missing customer.id is NOT success.
 */
export function parseCrmAcceptance(
  status: number,
  body: unknown,
): LeadResult {
  if (status >= 400) {
    const message =
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : "CRM rejected the lead.";
    return {
      ok: false,
      code: "upstream",
      message,
      status,
      retryable: status >= 500,
    };
  }

  const customerId =
    body &&
    typeof body === "object" &&
    "customer" in body &&
    (body as { customer?: { id?: unknown } }).customer &&
    typeof (body as { customer: { id?: unknown } }).customer === "object"
      ? (body as { customer: { id?: unknown } }).customer.id
      : undefined;

  if (customerId === null || customerId === undefined || customerId === "") {
    return {
      ok: false,
      code: "malformed_success",
      message:
        "CRM response did not include an accepted customer id. Please call us or try again.",
      status: 502,
      retryable: true,
    };
  }

  return { ok: true, customer_id: customerId as string | number };
}

export async function submitWebsiteLead(
  input: WebsiteLeadInput,
  config: CrmConfig,
): Promise<LeadResult> {
  if (config.mode === "live" && (!config.baseUrl || !config.apiKey)) {
    return {
      ok: false,
      code: "config",
      message: "CRM is not configured.",
      status: 500,
      retryable: false,
    };
  }

  const payload = mapWebsiteLeadToCrm(input);
  const idem = stableIdempotencyKey(input);

  if (config.mode === "mock") {
    const mocked = await mockCrm(config.mockScenario);
    if (mocked.timedOut) {
      return {
        ok: false,
        code: "timeout",
        message:
          "The request timed out before we could confirm. Please call us — do not assume it was received.",
        status: 504,
        retryable: true,
      };
    }
    const parsed = parseCrmAcceptance(mocked.status, mocked.body);
    if (parsed.ok) return { ...parsed, mocked: true };
    return parsed;
  }

  const url = `${config.baseUrl.replace(/\/$/, "")}/integrations/api/v1/leads/`;
  const fetchImpl = config.fetchImpl || fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "Idempotency-Key": idem,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    let body: unknown = null;
    const text = await response.text();
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }

    return parseCrmAcceptance(response.status, body);
  } catch (err) {
    const aborted =
      (err instanceof Error && err.name === "AbortError") ||
      (typeof err === "object" &&
        err &&
        "name" in err &&
        (err as { name: string }).name === "AbortError");
    if (aborted) {
      return {
        ok: false,
        code: "timeout",
        message:
          "The request timed out before we could confirm. Please call us — do not assume it was received.",
        status: 504,
        retryable: true,
      };
    }
    return {
      ok: false,
      code: "upstream",
      message: "Could not reach CRM.",
      status: 502,
      retryable: true,
    };
  } finally {
    clearTimeout(timer);
  }
}

export { stableIdempotencyKey };
