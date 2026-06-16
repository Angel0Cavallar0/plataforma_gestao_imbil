"use server";

import { requireAuth } from "@/lib/auth/session";
import { hasMarketingPermission } from "@/lib/auth/marketing";
import { createAdminClient } from "@/lib/supabase/admin";
import { marketingSchema } from "@/lib/supabase/marketing";
import { logAction } from "@/lib/auth/audit";
import { buildAdsManagerUrl, AD_PLATFORMS } from "@/lib/constants/marketing-ads";
import { brl, int } from "@/lib/marketing/ad-spend";
import {
  adsManagerLevelEnum,
  adPlatformEnum,
  adSpendFiltersSchema,
} from "@/lib/validations/marketing/ad-spend";
import { getCampaigns } from "@/server/queries/marketing/ad-spend";
import type { AdManagerLevel, AdPlatformSlug } from "@/types/marketing-ads";

type AdsManagerResult =
  | { ok: true; url: string }
  | { ok: false; reason: "not_configured" | "forbidden" | "missing_ids" };

/**
 * Resolve a URL do gerenciador de anúncios externo para deep link (Seção 8.2).
 * Gate em marketing.read. Lê apenas os IDs públicos da conta de anúncios via
 * client admin (a policy de SELECT de integration_credentials exige gestor+,
 * mas o deep link deve funcionar para qualquer leitor de marketing). Nenhum
 * segredo/token é retornado — apenas IDs necessários para montar a URL.
 */
export async function getAdsManagerUrl(
  platformSlug: AdPlatformSlug,
  level: AdManagerLevel = "account",
  ids?: { campaignId?: string; adId?: string },
): Promise<AdsManagerResult> {
  const session = await requireAuth();
  const slug = adPlatformEnum.parse(platformSlug);
  const lvl = adsManagerLevelEnum.parse(level);

  if (!(await hasMarketingPermission(session.profile.id, "read"))) {
    return { ok: false, reason: "forbidden" };
  }

  try {
    const admin = createAdminClient();

    const { data: platform } = await marketingSchema(admin)
      .from("platforms")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!platform) return { ok: false, reason: "not_configured" };

    const { data: cred } = await marketingSchema(admin)
      .from("integration_credentials")
      .select("credentials")
      .eq("platform_id", (platform as { id: string }).id)
      .eq("is_active", true)
      .maybeSingle();
    if (!cred) return { ok: false, reason: "not_configured" };

    const raw = (cred as { credentials?: Record<string, string> }).credentials ?? {};
    const url = buildAdsManagerUrl(slug, lvl, raw, ids);
    if (!url) return { ok: false, reason: "not_configured" };
    return { ok: true, url };
  } catch {
    return { ok: false, reason: "not_configured" };
  }
}

/**
 * Exporta as campanhas filtradas como CSV. Gate em marketing.read e registra
 * o evento mkt.ad_spend.exported no audit log (Seção 10.3).
 */
export async function exportCampaignsCsv(filtersInput: {
  date_from: string;
  date_to: string;
  platforms?: AdPlatformSlug[];
  search?: string;
}): Promise<{ ok: true; csv: string; filename: string } | { ok: false; error: string }> {
  const session = await requireAuth();
  if (!(await hasMarketingPermission(session.profile.id, "read"))) {
    return { ok: false, error: "Sem permissão no módulo Marketing." };
  }

  const filters = adSpendFiltersSchema.parse(filtersInput);
  const campaigns = await getCampaigns(filters);

  const header = [
    "Plataforma",
    "Campanha",
    "Impressões",
    "Cliques",
    "Investimento",
    "Conversões",
    "Valor de conversão",
    "CTR (%)",
    "CPC",
    "CPM",
    "Custo/conversão",
    "Taxa conversão (%)",
    "ROAS",
  ].join(";");

  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = campaigns.map((c) =>
    [
      AD_PLATFORMS[c.platform_slug].name,
      esc(c.campaign_name ?? c.external_campaign_id),
      int(c.impressions),
      int(c.clicks),
      brl(c.spend),
      int(c.conversions),
      c.conversions_value == null ? "—" : brl(c.conversions_value),
      c.ctr_pct ?? "—",
      c.cpc == null ? "—" : brl(c.cpc),
      c.cpm == null ? "—" : brl(c.cpm),
      c.cost_per_conversion == null ? "—" : brl(c.cost_per_conversion),
      c.conversion_rate_pct ?? "—",
      c.roas == null ? "—" : `${c.roas}x`,
    ].join(";"),
  );

  await logAction({
    userId: session.profile.id,
    action: "mkt.ad_spend.exported",
    resourceType: "marketing_ad_spend",
    metadata: {
      date_from: filters.date_from,
      date_to: filters.date_to,
      platforms: filters.platforms ?? "all",
      rows: campaigns.length,
    },
  });

  const csv = `${header}\n${lines.join("\n")}`;
  const filename = `midia-paga_${filters.date_from}_${filters.date_to}.csv`;
  return { ok: true, csv, filename };
}
