import { promotionalSmsOptedIn } from "./promotionalSms";
import type { CrmLeadPayload, WebsiteLeadInput } from "./types";

export function splitName(full: string): { first_name: string; last_name: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { first_name: "", last_name: "" };
  if (parts.length === 1) return { first_name: parts[0], last_name: "" };
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}

export function digitsOnlyPhone(phone: string): string {
  return phone.replace(/\D+/g, "");
}

function trimAttr(value: string | undefined): string {
  return (value || "").trim();
}

/**
 * Resolve promotional SMS consent without inferring opt-in.
 * Prefer explicit promotional_sms_opt_in; fall back to legacy sms_opt_in_status.
 * Missing / unchecked → false. Disclosure is whatever the client sent (no invented text).
 */
export function resolvePromotionalSms(input: WebsiteLeadInput): {
  promotional_sms_opt_in: boolean;
  promotional_sms_disclosure: string;
} {
  const hasExplicit =
    input.promotional_sms_opt_in !== undefined && input.promotional_sms_opt_in !== null;
  const optedIn = hasExplicit
    ? promotionalSmsOptedIn(input.promotional_sms_opt_in)
    : promotionalSmsOptedIn(input.sms_opt_in_status);

  return {
    promotional_sms_opt_in: optedIn,
    promotional_sms_disclosure: String(input.promotional_sms_disclosure || "").trim(),
  };
}

/**
 * Office-facing notes. Consent and attribution go on first-class CRM fields —
 * not duplicated here (except Source/Page/Submitted for office readability).
 */
export function buildNotes(input: WebsiteLeadInput): string {
  const lines = [
    "Website estimate request.",
    input.source ? `Source: ${input.source}` : "",
    input.page_url ? `Page: ${input.page_url}` : "",
    input.submitted_at ? `Submitted: ${input.submitted_at}` : "",
    input.services_interest ? `Services interest: ${input.services_interest}` : "",
    input.promotion_code ? `Promotion: ${input.promotion_code}` : "",
    input.notes ? `Customer notes: ${input.notes}` : "",
  ].filter(Boolean);
  return lines.join("\n");
}

function setIfPresent(
  target: CrmLeadPayload,
  key:
    | "utm_source"
    | "utm_medium"
    | "utm_campaign"
    | "utm_content"
    | "utm_term"
    | "fbclid"
    | "gclid"
    | "fbc"
    | "fbp"
    | "campaign_id"
    | "ad_id"
    | "browser_event_id"
    | "event_source_url",
  value: string,
): void {
  if (value) target[key] = value;
}

export function mapWebsiteLeadToCrm(input: WebsiteLeadInput): CrmLeadPayload {
  const names = splitName(input.name);
  const sms = resolvePromotionalSms(input);
  const payload: CrmLeadPayload = {
    first_name: names.first_name,
    last_name: names.last_name,
    email: input.email.trim(),
    phone: digitsOnlyPhone(input.phone),
    lead_source: (input.lead_source || "Website").trim() || "Website",
    notes: buildNotes(input),
    property: {
      address1: input.address.trim(),
      city: input.city.trim(),
      state: (input.state || "LA").trim() || "LA",
      postal_code: input.zip.trim(),
    },
    promotional_sms_opt_in: sms.promotional_sms_opt_in,
    promotional_sms_disclosure: sms.promotional_sms_disclosure,
  };

  setIfPresent(payload, "utm_source", trimAttr(input.utm_source));
  setIfPresent(payload, "utm_medium", trimAttr(input.utm_medium));
  setIfPresent(payload, "utm_campaign", trimAttr(input.utm_campaign));
  setIfPresent(payload, "utm_content", trimAttr(input.utm_content));
  setIfPresent(payload, "utm_term", trimAttr(input.utm_term));
  setIfPresent(payload, "fbclid", trimAttr(input.fbclid));
  setIfPresent(payload, "gclid", trimAttr(input.gclid));
  setIfPresent(payload, "fbc", trimAttr(input.fbc));
  setIfPresent(payload, "fbp", trimAttr(input.fbp));
  setIfPresent(payload, "campaign_id", trimAttr(input.campaign_id));
  setIfPresent(payload, "ad_id", trimAttr(input.ad_id));
  setIfPresent(
    payload,
    "browser_event_id",
    trimAttr(input.browser_event_id) || trimAttr(input.event_id),
  );
  setIfPresent(
    payload,
    "event_source_url",
    trimAttr(input.event_source_url) || trimAttr(input.page_url),
  );

  return payload;
}
