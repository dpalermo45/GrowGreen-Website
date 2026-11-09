import type { LeadFailure, WebsiteLeadInput } from "./types";
import { digitsOnlyPhone } from "./map";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateWebsiteLead(
  input: Partial<WebsiteLeadInput>,
): { ok: true; value: WebsiteLeadInput } | LeadFailure {
  if (String(input.website || "").trim()) {
    // Honeypot trip — respond like soft success to bots at API layer; caller decides.
    return {
      ok: false,
      code: "honeypot",
      message: "Ignored.",
      status: 200,
      retryable: false,
    };
  }

  const name = String(input.name || "").trim();
  const email = String(input.email || "").trim();
  const phone = String(input.phone || "").trim();
  const address = String(input.address || "").trim();
  const city = String(input.city || "").trim();
  const zip = String(input.zip || "").trim();

  if (!name || !email || !phone) {
    return {
      ok: false,
      code: "validation",
      message: "Name, email, and phone are required.",
      status: 400,
      retryable: false,
    };
  }
  if (!EMAIL_RE.test(email)) {
    return {
      ok: false,
      code: "validation",
      message: "Please enter a valid email address.",
      status: 400,
      retryable: false,
    };
  }
  if (digitsOnlyPhone(phone).length < 10) {
    return {
      ok: false,
      code: "validation",
      message: "Please enter a valid phone number.",
      status: 400,
      retryable: false,
    };
  }
  if (!address || !city || !zip) {
    return {
      ok: false,
      code: "validation",
      message: "Address, city, and ZIP are required.",
      status: 400,
      retryable: false,
    };
  }
  if (!/^\d{5}(-\d{4})?$/.test(zip)) {
    return {
      ok: false,
      code: "validation",
      message: "Please enter a valid ZIP code.",
      status: 400,
      retryable: false,
    };
  }

  return {
    ok: true,
    value: {
      ...input,
      name,
      email,
      phone,
      address,
      city,
      zip,
      state: String(input.state || "LA").trim() || "LA",
    } as WebsiteLeadInput,
  };
}
