export type CareersConfig = {
  mode: "mock" | "live";
  baseUrl: string;
  openingsUrl: string;
  applicationsUrl: string;
};

/**
 * Careers uses CRM *public* hiring endpoints — not the customer lead intake
 * and not the Bearer-authenticated leads API.
 */
export function readCareersConfigFromEnv(): CareersConfig {
  const mode = process.env.GGWC_CRM_MODE === "live" ? "live" : "mock";
  const baseUrl = (
    process.env.GGWC_CAREERS_CRM_BASE_URL ||
    process.env.GGWC_CRM_BASE_URL ||
    "https://crm.growgreenweedcontrol.com"
  )
    .trim()
    .replace(/\/$/, "");

  return {
    mode,
    baseUrl,
    openingsUrl: `${baseUrl}/api/public/careers/openings/`,
    applicationsUrl: `${baseUrl}/api/public/careers/applications/`,
  };
}
