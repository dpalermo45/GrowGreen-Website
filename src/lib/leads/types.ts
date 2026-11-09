export type WebsiteLeadInput = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  state?: string;
  lead_source?: string;
  source?: string;
  page_url?: string;
  /** Prefer for CRM CAPI; falls back to page_url when mapping. */
  event_source_url?: string;
  submitted_at?: string;
  /**
   * Legacy browser field ("Yes" | "No"). Mapped to promotional_sms_opt_in.
   * Unchecked / missing → false. Never inferred as true.
   */
  sms_opt_in_status?: string;
  /** Explicit promotional SMS consent (boolean or Yes/No string). */
  promotional_sms_opt_in?: boolean | string;
  /** Exact disclosure text shown to the visitor when consent was collected. */
  promotional_sms_disclosure?: string;
  /** Browser may supply; forwarded into notes when present. */
  notes?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  fbclid?: string;
  gclid?: string;
  fbc?: string;
  fbp?: string;
  campaign_id?: string;
  ad_id?: string;
  browser_event_id?: string;
  event_id?: string;
  idempotency_key?: string;
  /** Honeypot — must be empty. */
  website?: string;
  services_interest?: string;
  promotion_code?: string;
};

export type CrmLeadPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  lead_source: string;
  notes: string;
  property: {
    address1: string;
    city: string;
    state: string;
    postal_code: string;
  };
  /** Always boolean — false when unchecked / missing. Never omitted as inferred true. */
  promotional_sms_opt_in: boolean;
  /** Exact disclosure presented (or empty if the client did not send one). */
  promotional_sms_disclosure: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  gclid?: string;
  fbc?: string;
  fbp?: string;
  campaign_id?: string;
  ad_id?: string;
  browser_event_id?: string;
  event_source_url?: string;
};

export type LeadAcceptance = {
  ok: true;
  customer_id: string | number;
  mocked?: boolean;
};

export type LeadFailure = {
  ok: false;
  code:
    | "honeypot"
    | "validation"
    | "config"
    | "upstream"
    | "timeout"
    | "malformed_success"
    | "rate_limit";
  message: string;
  status: number;
  retryable: boolean;
};

export type LeadResult = LeadAcceptance | LeadFailure;
