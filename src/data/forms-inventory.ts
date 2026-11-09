export type FormField = {
  name: string;
  label: string;
  type:
    | "text"
    | "tel"
    | "email"
    | "textarea"
    | "checkbox"
    | "select"
    | "hidden"
    | "file"
    | "address";
  required?: boolean;
  options?: string[];
  notes?: string;
};

export type FormDefinition = {
  id: string;
  name: string;
  /** Page paths that host this form */
  paths: string[];
  purpose: string;
  /** Where submissions go */
  handler: "lead-intake" | "contact-message" | "careers" | "campaign-lead";
  successPath?: string;
  fields: FormField[];
  honeypot?: string;
  notes?: string[];
};

/**
 * Separate form surfaces: contact, quote, campaigns, careers.
 * Careers must NOT route into customer lead intake.
 */
export const forms: FormDefinition[] = [
  {
    id: "contact",
    name: "Contact Us",
    paths: ["/contact-us/"],
    purpose:
      "General service questions, account help, or lawn concerns — not the primary new-customer quote funnel.",
    handler: "contact-message",
    successPath: "/contact-us/?sent=1",
    fields: [
      { name: "full_name", label: "Full name", type: "text", required: true },
      { name: "phone", label: "Phone", type: "tel", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      {
        name: "service_address",
        label: "Service address (optional for existing customers)",
        type: "address",
      },
      { name: "message", label: "How can we help?", type: "textarea", required: true },
      {
        name: "sms_consent",
        label: "SMS consent",
        type: "checkbox",
        notes: "Consent text may be stored in notes; not proof of CRM SMS opt-in field.",
      },
    ],
    honeypot: "company_website",
    notes: [
      "Office hours stated on page: Mon–Fri 8:00 a.m.–4:00 p.m. America/Chicago",
      "Do not treat as estimate-only intake; quote funnel is separate",
    ],
  },
  {
    id: "quote",
    name: "Request a Quote",
    paths: ["/request-a-quote/"],
    purpose: "Primary new-customer lawn estimate request for selected services.",
    handler: "lead-intake",
    successPath: "/thank-you/",
    fields: [
      { name: "full_name", label: "Full name", type: "text", required: true },
      { name: "phone", label: "Phone", type: "tel", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      {
        name: "street_address",
        label: "Service street address",
        type: "address",
        required: true,
      },
      { name: "city", label: "City", type: "text", required: true },
      { name: "state", label: "State", type: "text", required: true },
      { name: "zip", label: "ZIP", type: "text", required: true },
      {
        name: "services",
        label: "Services of interest",
        type: "select",
        required: true,
        notes: "Multi-select; include Help me choose",
        options: [
          "Lawn fertilization & weed control",
          "Flower bed weed control",
          "Fire ant treatment",
          "Mosquito, flea & tick",
          "Tree & shrub care",
          "Lawn fungus",
          "Lawn insects",
          "Soil sample",
          "Liquid aeration",
          "Core aeration",
          "Help me choose",
        ],
      },
      { name: "notes", label: "Anything else we should know?", type: "textarea" },
      { name: "sms_consent", label: "SMS consent", type: "checkbox" },
    ],
    honeypot: "company_website",
    notes: [
      "Maps to website-owned POST /api/leads/website → CRM leads API",
      "Success only after acceptance criteria met — never bare HTTP 200",
    ],
  },
  {
    id: "campaign",
    name: "Campaign estimate",
    paths: [
      "/request-an-estimate-facebook-50/",
      "/facebook-estimate-request/",
      "/post-card-estimate-request/",
      "/trucklead/",
      "/gym-member-lawn-care-special/",
      "/nextdoor-estimate-request/",
    ],
    purpose:
      "Offer-specific estimate intake. Same CRM lead bridge as quote, with campaign lead-source / offer notes.",
    handler: "campaign-lead",
    successPath: "/thank-you/",
    fields: [
      { name: "full_name", label: "Full name", type: "text", required: true },
      { name: "phone", label: "Phone", type: "tel", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      {
        name: "street_address",
        label: "Service street address",
        type: "address",
        required: true,
      },
      { name: "city", label: "City", type: "text", required: true },
      { name: "zip", label: "ZIP", type: "text", required: true },
      {
        name: "campaign_id",
        label: "Campaign id",
        type: "hidden",
        required: true,
        notes: "Set per landing from src/data/campaigns.ts",
      },
      {
        name: "offer_code",
        label: "Offer code",
        type: "hidden",
        notes: "e.g. facebook-50, neighbor-25 — reviewable/expirable",
      },
      { name: "sms_consent", label: "SMS consent", type: "checkbox" },
    ],
    honeypot: "company_website",
    notes: [
      "Nextdoor may use /thank-you-nextdoor/",
      "Liquid aeration and core aeration have dedicated thank-you variants in WP — keep if those forms stay separate",
      "Never merge careers into this handler",
    ],
  },
  {
    id: "careers",
    name: "Careers application",
    paths: ["/careers/"],
    purpose:
      "Job applications for Grow Green openings. Separate from customer lead intake.",
    handler: "careers",
    fields: [
      {
        name: "job_opening_slug",
        label: "Position",
        type: "select",
        required: true,
        notes: "Loaded from CRM public openings API",
      },
      { name: "first_name", label: "First name", type: "text", required: true },
      { name: "last_name", label: "Last name", type: "text", required: true },
      { name: "phone", label: "Phone", type: "tel", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "city", label: "City", type: "text", required: true },
      { name: "state", label: "State", type: "select", required: true },
      { name: "zip", label: "ZIP", type: "text", required: true },
      {
        name: "experience_summary",
        label: "Experience and work history",
        type: "textarea",
        required: true,
      },
      {
        name: "why_good_fit",
        label: "Why good fit",
        type: "textarea",
        required: true,
      },
      {
        name: "resume",
        label: "Résumé (optional)",
        type: "file",
        notes: "PDF/DOC/DOCX · max 10 MB; multipart to CRM careers applications",
      },
    ],
    honeypot: "website",
    notes: [
      "MUST NOT post to CRM customer lead intake",
      "Website proxies: GET /api/careers/openings/ → CRM /api/public/careers/openings/",
      "Website proxies: POST /api/careers/applications/ (multipart) → CRM /api/public/careers/applications/",
      "Success requires HTTP 201 + { ok: true }",
    ],
  },
];

export const formById = Object.fromEntries(forms.map((f) => [f.id, f])) as Record<
  string,
  FormDefinition
>;

export const leadIntakeFormIds = forms
  .filter((f) => f.handler === "lead-intake" || f.handler === "campaign-lead")
  .map((f) => f.id);

export const careersForm = formById.careers;
