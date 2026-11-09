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
  submitted_at?: string;
  sms_opt_in_status?: string;
  /** Browser may supply; forwarded into notes when present (proxy historically ignored). */
  notes?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  fbclid?: string;
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
