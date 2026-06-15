import { z } from "zod";

export const adPlatformEnum = z.enum(["meta_ads", "google_ads", "linkedin_ads"]);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato yyyy-mm-dd");

/**
 * Filtros do submódulo de mídia paga. As datas trafegam como string
 * yyyy-mm-dd (vindas dos searchParams) para consulta direta no Supabase.
 */
export const adSpendFiltersSchema = z
  .object({
    date_from: isoDate,
    date_to: isoDate,
    platforms: z.array(adPlatformEnum).optional(),
    search: z.string().max(120).optional(),
  })
  .refine((d) => d.date_to >= d.date_from, {
    message: "Data final deve ser maior ou igual à inicial",
    path: ["date_to"],
  });

export type AdSpendFiltersInput = z.infer<typeof adSpendFiltersSchema>;

export const trendMetricEnum = z.enum(["cpc", "cpm", "ctr"]);

export const adsManagerLevelEnum = z.enum(["account", "campaign", "ad"]);
