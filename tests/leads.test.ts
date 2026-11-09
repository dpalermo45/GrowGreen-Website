import { describe, expect, it, beforeEach } from "vitest";
import { buildNotes, mapWebsiteLeadToCrm, splitName, digitsOnlyPhone } from "../src/lib/leads/map";
import { validateWebsiteLead } from "../src/lib/leads/validate";
import {
  parseCrmAcceptance,
  submitWebsiteLead,
  type CrmConfig,
} from "../src/lib/leads/submit";
import { checkRateLimit, resetRateLimits } from "../src/lib/leads/rateLimit";

const baseInput = {
  name: "Jane Q Public",
  email: "jane@example.com",
  phone: "(225) 555-0100",
  address: "100 Main St",
  city: "Gonzales",
  zip: "70737",
  state: "LA",
  source: "unit-test",
  page_url: "https://growgreenweedcontrol.com/request-a-quote/",
  submitted_at: "2026-11-05T12:00:00Z",
  sms_opt_in_status: "Yes",
  notes: "Gate code 1234",
  utm_source: "facebook",
  fbclid: "abc123",
  promotion_code: "FB50",
  idempotency_key: "test-key-1",
};

describe("name/phone transforms", () => {
  it("splits names like the PHP proxy", () => {
    expect(splitName("Jane")).toEqual({ first_name: "Jane", last_name: "" });
    expect(splitName("Jane Q Public")).toEqual({
      first_name: "Jane",
      last_name: "Q Public",
    });
  });

  it("strips phone to digits", () => {
    expect(digitsOnlyPhone("(225) 555-0100")).toBe("2255550100");
  });
});

describe("payload mapping", () => {
  it("maps property structure and lead_source", () => {
    const payload = mapWebsiteLeadToCrm(baseInput);
    expect(payload.first_name).toBe("Jane");
    expect(payload.last_name).toBe("Q Public");
    expect(payload.lead_source).toBe("Website");
    expect(payload.property).toEqual({
      address1: "100 Main St",
      city: "Gonzales",
      state: "LA",
      postal_code: "70737",
    });
    expect(payload.phone).toBe("2255550100");
  });

  it("includes SMS status in notes without claiming CRM opt-in field", () => {
    const notes = buildNotes(baseInput);
    expect(notes).toContain("SMS marketing opt-in (self-reported on form; not a CRM consent API field): Yes");
    expect(notes).toContain("Customer notes: Gate code 1234");
    expect(notes).toContain("utm_source: facebook");
    expect(notes).toContain("fbclid: abc123");
    expect(notes).toContain("Promotion: FB50");
  });

  it("defaults SMS opt-in note to No", () => {
    const notes = buildNotes({ ...baseInput, sms_opt_in_status: undefined });
    expect(notes).toContain("SMS marketing opt-in (self-reported on form; not a CRM consent API field): No");
  });
});

describe("validation", () => {
  it("requires core fields", () => {
    const res = validateWebsiteLead({ name: "", email: "", phone: "" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("validation");
  });

  it("detects honeypot", () => {
    const res = validateWebsiteLead({ ...baseInput, website: "http://spam" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("honeypot");
  });

  it("accepts valid payload", () => {
    const res = validateWebsiteLead(baseInput);
    expect(res.ok).toBe(true);
  });
});

describe("CRM acceptance parsing", () => {
  it("rejects bare HTTP 200 empty body", () => {
    const res = parseCrmAcceptance(200, {});
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("malformed_success");
  });

  it("rejects null customer_id", () => {
    const res = parseCrmAcceptance(201, { customer: { id: null } });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("malformed_success");
  });

  it("accepts customer id", () => {
    const res = parseCrmAcceptance(201, { customer: { id: 42 } });
    expect(res).toEqual({ ok: true, customer_id: 42 });
  });

  it("surfaces upstream rejection", () => {
    const res = parseCrmAcceptance(422, { error: "bad lead" });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("upstream");
      expect(res.message).toBe("bad lead");
    }
  });
});

describe("submitWebsiteLead", () => {
  it("mock success returns mocked acceptance", async () => {
    const res = await submitWebsiteLead(baseInput, {
      mode: "mock",
      baseUrl: "",
      apiKey: "",
      mockScenario: "success",
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.mocked).toBe(true);
      expect(res.customer_id).toBeTruthy();
    }
  });

  it("mock null customer fails", async () => {
    const res = await submitWebsiteLead(baseInput, {
      mode: "mock",
      baseUrl: "",
      apiKey: "",
      mockScenario: "null_customer",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("malformed_success");
  });

  it("live mode without config fails clearly", async () => {
    const res = await submitWebsiteLead(baseInput, {
      mode: "live",
      baseUrl: "",
      apiKey: "",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("config");
  });

  it("handles timeout scenario", async () => {
    const res = await submitWebsiteLead(baseInput, {
      mode: "mock",
      baseUrl: "",
      apiKey: "",
      mockScenario: "timeout",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("timeout");
  });

  it("preserves idempotency key to upstream", async () => {
    const keys: string[] = [];
    const fetchImpl: typeof fetch = async (_url, init) => {
      const headers = new Headers(init?.headers);
      keys.push(headers.get("Idempotency-Key") || "");
      return new Response(JSON.stringify({ customer: { id: "c1" } }), { status: 201 });
    };
    const config: CrmConfig = {
      mode: "live",
      baseUrl: "https://crm.example",
      apiKey: "secret",
      fetchImpl,
    };
    await submitWebsiteLead(baseInput, config);
    await submitWebsiteLead(baseInput, config);
    expect(keys[0]).toBe("test-key-1");
    expect(keys[1]).toBe("test-key-1");
  });
});

describe("rate limit", () => {
  beforeEach(() => resetRateLimits());

  it("blocks after limit", () => {
    for (let i = 0; i < 8; i++) {
      expect(checkRateLimit("ip-1", 8, 60_000).allowed).toBe(true);
    }
    const blocked = checkRateLimit("ip-1", 8, 60_000);
    expect(blocked.allowed).toBe(false);
  });
});

describe("tracking event contract (unit-level)", () => {
  it("conversion should only fire when ok and customer_id present", () => {
    const shouldFire = (data: { ok?: boolean; customer_id?: unknown }) =>
      Boolean(data.ok && data.customer_id != null && data.customer_id !== "");
    expect(shouldFire({ ok: true, customer_id: null })).toBe(false);
    expect(shouldFire({ ok: true, customer_id: "x" })).toBe(true);
    expect(shouldFire({ ok: false, customer_id: "x" })).toBe(false);
  });
});
