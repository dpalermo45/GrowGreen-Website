/**
 * Canonical promotional SMS disclosure — must match CRM
 * `customers.services.promotional_sms_consent.PROMOTIONAL_SMS_DISCLOSURE`
 * exactly (whitespace-normalized) for consent to record.
 *
 * Verified from local CRM repo `/home/dpalermo45/projects/ggwc_crm`.
 * Do not paraphrase; CRM rejects mismatched disclosure text.
 */
export const PROMOTIONAL_SMS_DISCLOSURE =
  "By checking this box, I agree to receive promotional text messages from " +
  "Grow Green Weed Control about occasional seasonal lawn care offers. " +
  "Message frequency varies. Message and data rates may apply. Reply STOP to " +
  "opt out or HELP for help. Consent is not a condition of purchase. " +
  "Privacy Policy: https://growgreenweedcontrol.com/privacy-policy/ " +
  "Terms and Conditions: https://growgreenweedcontrol.com/terms-and-conditions/";

/**
 * Mirrors CRM `opted_in_value`: true only for explicit affirmative values.
 * Never treats missing/undefined as consent.
 */
export function promotionalSmsOptedIn(value: unknown): boolean {
  if (value === true) return true;
  if (value === false || value === null || value === undefined) return false;
  return ["yes", "true", "1", "on"].includes(String(value).trim().toLowerCase());
}
