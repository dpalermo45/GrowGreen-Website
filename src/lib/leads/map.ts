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

/**
 * Build CRM notes.
 * Preserves proxy lines and appends browser notes / UTM / promotion context
 * without treating SMS note text as a CRM opt-in field.
 */
export function buildNotes(input: WebsiteLeadInput): string {
  const sms = input.sms_opt_in_status?.trim() || "No";
  const lines = [
    "Website estimate request.",
    input.source ? `Source: ${input.source}` : "",
    input.page_url ? `Page: ${input.page_url}` : "",
    input.submitted_at ? `Submitted: ${input.submitted_at}` : "",
    `SMS marketing opt-in (self-reported on form; not a CRM consent API field): ${sms}`,
    input.services_interest ? `Services interest: ${input.services_interest}` : "",
    input.promotion_code ? `Promotion: ${input.promotion_code}` : "",
    input.utm_source ? `utm_source: ${input.utm_source}` : "",
    input.utm_medium ? `utm_medium: ${input.utm_medium}` : "",
    input.utm_campaign ? `utm_campaign: ${input.utm_campaign}` : "",
    input.utm_term ? `utm_term: ${input.utm_term}` : "",
    input.utm_content ? `utm_content: ${input.utm_content}` : "",
    input.fbclid ? `fbclid: ${input.fbclid}` : "",
    input.notes ? `Customer notes: ${input.notes}` : "",
  ].filter(Boolean);
  return lines.join("\n");
}

export function mapWebsiteLeadToCrm(input: WebsiteLeadInput): CrmLeadPayload {
  const names = splitName(input.name);
  return {
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
  };
}
