import { z } from "zod";

export const adAccountPlatformEnum = z.enum(["meta_ads", "google_ads", "linkedin_ads"]);

/** Meta Ads — apenas o ID da conta de anúncios (deep link). */
export const metaAdAccountSchema = z.object({
  ad_account_id: z
    .string()
    .trim()
    .min(1, "Informe o ID da conta")
    .max(64)
    .regex(/^(act_)?\d+$/, "Use apenas números (ex.: 1234567890)"),
});

/** Google Ads — customer id e, opcionalmente, o MCC (login customer id). */
export const googleAdAccountSchema = z.object({
  customer_id: z
    .string()
    .trim()
    .min(1, "Informe o Customer ID")
    .max(32)
    .regex(/^[\d-]+$/, "Use apenas números e hífens"),
  login_customer_id: z
    .string()
    .trim()
    .max(32)
    .regex(/^[\d-]*$/, "Use apenas números e hífens")
    .optional()
    .or(z.literal("")),
});

/** LinkedIn Ads — account id e, opcionalmente, a organization URN. */
export const linkedinAdAccountSchema = z.object({
  account_id: z
    .string()
    .trim()
    .min(1, "Informe o Account ID")
    .max(32)
    .regex(/^\d+$/, "Use apenas números"),
  organization_urn: z
    .string()
    .trim()
    .max(120)
    .regex(/^urn:li:organization:\d+$/, "Formato: urn:li:organization:123456")
    .optional()
    .or(z.literal("")),
});

export type MetaAdAccountInput = z.infer<typeof metaAdAccountSchema>;
export type GoogleAdAccountInput = z.infer<typeof googleAdAccountSchema>;
export type LinkedinAdAccountInput = z.infer<typeof linkedinAdAccountSchema>;
