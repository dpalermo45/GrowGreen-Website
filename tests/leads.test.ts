import { describe, expect, it, beforeEach } from "vitest";
import {
  buildNotes,
  mapWebsiteLeadToCrm,
  resolvePromotionalSms,
  splitName,
  digitsOnlyPhone,
} from "../src/lib/leads/map";
import { PROMOTIONAL_SMS_DISCLOSURE } from "../src/lib/leads/promotionalSms";
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
  promotional_sms_opt_in: true,
  promotional_sms_disclosure: PROMOTIONAL_SMS_DISCLOSURE,
  notes: "Gate code 1234",
  utm_source: "facebook",
  utm_medium: "cpc",
  utm_campaign: "november",
  fbclid: "abc123",
  gclid: "gclid-9",
  fbp: "fb.1.123.456",
  fbc: "fb.1.abc",
  promotion_code: "FB50",
  idempotency_key: "test-key-1",
  browser_event_id: "lead-event-1",
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

  it("maps promotional SMS consent checked with exact disclosure", () => {
    const payload = mapWebsiteLeadToCrm(baseInput);
    expect(payload.promotional_sms_opt_in).toBe(true);
    expect(payload.promotional_sms_disclosure).toBe(PROMOTIONAL_SMS_DISCLOSURE);
    expect(payload.notes).not.toMatch(/SMS marketing opt-in/i);
    expect(payload.notes).toContain("Customer notes: Gate code 1234");
    expect(payload.notes).toContain("Promotion: FB50");
    expect(payload.notes).not.toContain("utm_source:");
    expect(payload.notes).not.toContain("fbclid:");
  });

  it("maps promotional SMS consent unchecked as false without inferring", () => {
    const payload = mapWebsiteLeadToCrm({
      ...baseInput,
      promotional_sms_opt_in: false,
      sms_opt_in_status: "No",
      promotional_sms_disclosure: PROMOTIONAL_SMS_DISCLOSURE,
    });
    expect(payload.promotional_sms_opt_in).toBe(false);
    expect(payload.promotional_sms_disclosure).toBe(PROMOTIONAL_SMS_DISCLOSURE);
  });

  it("defaults missing consent to false and does not invent disclosure text", () => {
    const { promotional_sms_opt_in, promotional_sms_disclosure } = resolvePromotionalSms({
      ...baseInput,
      promotional_sms_opt_in: undefined,
      sms_opt_in_status: undefined,
      promotional_sms_disclosure: undefined,
    });
    expect(promotional_sms_opt_in).toBe(false);
    expect(promotional_sms_disclosure).toBe("");
  });

  it("preserves legacy sms_opt_in_status Yes/No when explicit field absent", () => {
    expect(
      resolvePromotionalSms({
        ...baseInput,
        promotional_sms_opt_in: undefined,
        sms_opt_in_status: "Yes",
      }).promotional_sms_opt_in,
    ).toBe(true);
    expect(
      resolvePromotionalSms({
        ...baseInput,
        promotional_sms_opt_in: undefined,
        sms_opt_in_status: "No",
      }).promotional_sms_opt_in,
    ).toBe(false);
  });

  it("maps UTM, click-ID, and source-page fields directly", () => {
    const payload = mapWebsiteLeadToCrm(baseInput);
    expect(payload.utm_source).toBe("facebook");
    expect(payload.utm_medium).toBe("cpc");
    expect(payload.utm_campaign).toBe("november");
    expect(payload.fbclid).toBe("abc123");
    expect(payload.gclid).toBe("gclid-9");
    expect(payload.fbp).toBe("fb.1.123.456");
    expect(payload.fbc).toBe("fb.1.abc");
    expect(payload.browser_event_id).toBe("lead-event-1");
    expect(payload.event_source_url).toBe(
      "https://growgreenweedcontrol.com/request-a-quote/",
    );
  });

  it("prefers event_source_url over page_url when both present", () => {
    const payload = mapWebsiteLeadToCrm({
      ...baseInput,
      event_source_url: "https://growgreenweedcontrol.com/facebook-landing/",
    });
    expect(payload.event_source_url).toBe(
      "https://growgreenweedcontrol.com/facebook-landing/",
    );
  });

  it("keeps office notes without consent/attribution duplication", () => {
    const notes = buildNotes(baseInput);
    expect(notes).toContain("Website estimate request.");
    expect(notes).toContain("Source: unit-test");
    expect(notes).toContain("Page: https://growgreenweedcontrol.com/request-a-quote/");
    expect(notes).toContain("Submitted: 2026-11-05T12:00:00Z");
    expect(notes).toContain("Customer notes: Gate code 1234");
    expect(notes).not.toMatch(/SMS marketing opt-in/i);
    expect(notes).not.toContain("utm_source:");
  });

  it("preserves Facebook campaign lead_source string", () => {
    const leadSource =
      "Facebook Ad - November 50% Off First Treatment (Up to $75)";
    const payload = mapWebsiteLeadToCrm({
      ...baseInput,
      lead_source: leadSource,
    });
    expect(payload.lead_source).toBe(leadSource);
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

  it("preserves idempotency key and mapped consent/attribution to upstream", async () => {
    const keys: string[] = [];
    const bodies: Array<Record<string, unknown>> = [];
    const fetchImpl: typeof fetch = async (_url, init) => {
      const headers = new Headers(init?.headers);
      keys.push(headers.get("Idempotency-Key") || "");
      bodies.push(JSON.parse(String(init?.body || "{}")));
      return new Response(JSON.stringify({ customer: { id: "c1" } }), { status: 201 });
    };
    const config: CrmConfig = {
      mode: "live",
      baseUrl: "https://crm.example",
      apiKey: "secret",
      fetchImpl,
    };
    await submitWebsiteLead(baseInput, config);
    await submitWebsiteLead(
      {
        ...baseInput,
        promotional_sms_opt_in: false,
        sms_opt_in_status: "No",
      },
      config,
    );
    expect(keys[0]).toBe("test-key-1");
    expect(keys[1]).toBe("test-key-1");
    expect(bodies[0].promotional_sms_opt_in).toBe(true);
    expect(bodies[0].promotional_sms_disclosure).toBe(PROMOTIONAL_SMS_DISCLOSURE);
    expect(bodies[0].utm_source).toBe("facebook");
    expect(bodies[0].fbclid).toBe("abc123");
    expect(bodies[0].gclid).toBe("gclid-9");
    expect(bodies[0].event_source_url).toBe(
      "https://growgreenweedcontrol.com/request-a-quote/",
    );
    expect(bodies[0].lead_source).toBe("Website");
    expect(bodies[1].promotional_sms_opt_in).toBe(false);
    expect(bodies[1].promotional_sms_disclosure).toBe(PROMOTIONAL_SMS_DISCLOSURE);
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
  it("conversion should only fire when ok and customer_id present", async () => {
    const { isConfirmedWebsiteLeadAcceptance, shouldFireMetaLead } =
      await import("../src/lib/analytics/metaPixel");
    expect(
      isConfirmedWebsiteLeadAcceptance({ ok: true, customer_id: null }, true),
    ).toBe(false);
    expect(
      isConfirmedWebsiteLeadAcceptance({ ok: true, customer_id: "x" }, true),
    ).toBe(true);
    expect(
      isConfirmedWebsiteLeadAcceptance({ ok: false, customer_id: "x" }, true),
    ).toBe(false);
    expect(
      shouldFireMetaLead({
        accepted: true,
        mocked: false,
        browserEventId: "shared-id",
        pixelAvailable: true,
        alreadyFiredForEventId: false,
      }),
    ).toBe(true);
    expect(
      shouldFireMetaLead({
        accepted: true,
        mocked: true,
        browserEventId: "shared-id",
        pixelAvailable: true,
        alreadyFiredForEventId: false,
      }),
    ).toBe(false);
  });
});
