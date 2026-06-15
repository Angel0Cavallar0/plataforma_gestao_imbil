import { createClient } from "@/lib/supabase/server";
import { marketingSchema } from "@/lib/supabase/marketing";
import { AD_PLATFORMS } from "@/lib/constants/marketing-ads";
import type {
  AdPlatformSlug,
  AdSpendFilters,
  CampaignRow,
  FunnelRow,
  IntegrationHealthRow,
  OverviewKpis,
  PlatformSummary,
  TrendMetric,
  TrendPoint,
} from "@/types/marketing-ads";

type DailyRow = {
  platform_slug: AdPlatformSlug;
  external_campaign_id: string;
  campaign_name: string | null;
  data_referencia: string;
  impressions: number | null;
  reach: number | null;
  clicks: number | null;
  spend: number | null;
  conversions: number | null;
  conversions_value: number | null;
};

function num(v: number | null | undefined): number {
  return v == null || Number.isNaN(Number(v)) ? 0 : Number(v);
}

/** Aplica filtros de período/plataforma/busca a uma query sobre v_campaigns_daily. */
async function fetchCampaignDaily(filters: AdSpendFilters): Promise<DailyRow[]> {
  const supabase = await createClient();
  let q = marketingSchema(supabase)
    .from("v_campaigns_daily")
    .select(
      "platform_slug, external_campaign_id, campaign_name, data_referencia, impressions, reach, clicks, spend, conversions, conversions_value",
    )
    .gte("data_referencia", filters.date_from)
    .lte("data_referencia", filters.date_to);

  if (filters.platforms?.length) {
    q = q.in("platform_slug", filters.platforms);
  }
  if (filters.search) {
    q = q.ilike("campaign_name", `%${filters.search}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as DailyRow[];
}

/** Tabela unificada de campanhas, agregada no período (Seção 7.3 / 9.3). */
export async function getCampaigns(filters: AdSpendFilters): Promise<CampaignRow[]> {
  const rows = await fetchCampaignDaily(filters);

  const map = new Map<
    string,
    {
      platform_slug: AdPlatformSlug;
      external_campaign_id: string;
      campaign_name: string | null;
      impressions: number;
      clicks: number;
      spend: number;
      conversions: number;
      conversions_value: number;
      hasValue: boolean;
    }
  >();

  for (const r of rows) {
    const key = `${r.platform_slug}:${r.external_campaign_id}`;
    const acc = map.get(key) ?? {
      platform_slug: r.platform_slug,
      external_campaign_id: r.external_campaign_id,
      campaign_name: r.campaign_name,
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
      conversions_value: 0,
      hasValue: false,
    };
    acc.impressions += num(r.impressions);
    acc.clicks += num(r.clicks);
    acc.spend += num(r.spend);
    acc.conversions += num(r.conversions);
    if (r.conversions_value != null) {
      acc.conversions_value += num(r.conversions_value);
      acc.hasValue = true;
    }
    map.set(key, acc);
  }

  return [...map.values()]
    .map((a): CampaignRow => {
      const hasValue = AD_PLATFORMS[a.platform_slug].hasConversionValue;
      return {
        platform_slug: a.platform_slug,
        external_campaign_id: a.external_campaign_id,
        campaign_name: a.campaign_name,
        impressions: a.impressions,
        clicks: a.clicks,
        spend: a.spend,
        conversions: a.conversions,
        conversions_value: hasValue ? a.conversions_value : null,
        ctr_pct: a.impressions > 0 ? round2((a.clicks / a.impressions) * 100) : null,
        cpc: a.clicks > 0 ? round2(a.spend / a.clicks) : null,
        cpm: a.impressions > 0 ? round2((a.spend / a.impressions) * 1000) : null,
        cost_per_conversion: a.conversions > 0 ? round2(a.spend / a.conversions) : null,
        conversion_rate_pct:
          a.clicks > 0 ? round2((a.conversions / a.clicks) * 100) : null,
        roas:
          hasValue && a.spend > 0 && a.conversions_value > 0
            ? round2(a.conversions_value / a.spend)
            : null,
      };
    })
    .sort((x, y) => y.spend - x.spend);
}

/** Resumo por plataforma no período (3 cards de split). */
export async function getPlatformSplit(
  filters: AdSpendFilters,
): Promise<PlatformSummary[]> {
  const rows = await fetchCampaignDaily(filters);
  const map = new Map<AdPlatformSlug, PlatformSummary & { _campaigns: Set<string> }>();

  for (const r of rows) {
    const acc =
      map.get(r.platform_slug) ??
      ({
        platform_slug: r.platform_slug,
        campaigns_total: 0,
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        conversions_value: AD_PLATFORMS[r.platform_slug].hasConversionValue ? 0 : null,
        first_date: r.data_referencia,
        last_date: r.data_referencia,
        _campaigns: new Set<string>(),
      } as PlatformSummary & { _campaigns: Set<string> });

    acc.impressions += num(r.impressions);
    acc.clicks += num(r.clicks);
    acc.spend += num(r.spend);
    acc.conversions += num(r.conversions);
    if (r.conversions_value != null && acc.conversions_value != null) {
      acc.conversions_value += num(r.conversions_value);
    }
    acc._campaigns.add(r.external_campaign_id);
    if (r.data_referencia < (acc.first_date ?? r.data_referencia))
      acc.first_date = r.data_referencia;
    if (r.data_referencia > (acc.last_date ?? r.data_referencia))
      acc.last_date = r.data_referencia;
    map.set(r.platform_slug, acc);
  }

  return [...map.values()]
    .map(({ _campaigns, ...s }) => ({ ...s, campaigns_total: _campaigns.size }))
    .sort((a, b) => b.spend - a.spend);
}

/** KPIs consolidados da visão geral (Seção 6.1 / 6.3). */
export async function getOverviewKpis(filters: AdSpendFilters): Promise<OverviewKpis> {
  const split = await getPlatformSplit(filters);

  let spend_total = 0;
  let conversions_total = 0;
  let clicks_total = 0;
  let conversions_value_total = 0;
  let spend_with_value = 0;
  let spend_without_value = 0;

  for (const p of split) {
    spend_total += p.spend;
    conversions_total += p.conversions;
    clicks_total += p.clicks;
    if (AD_PLATFORMS[p.platform_slug].hasConversionValue) {
      spend_with_value += p.spend;
      conversions_value_total += num(p.conversions_value);
    } else {
      spend_without_value += p.spend;
    }
  }

  return {
    spend_total,
    conversions_total,
    clicks_total,
    conversions_value_total,
    spend_with_value,
    spend_without_value,
    cost_per_conversion:
      conversions_total > 0 ? round2(spend_total / conversions_total) : null,
    conversion_rate_pct:
      clicks_total > 0 ? round2((conversions_total / clicks_total) * 100) : null,
    roas:
      spend_with_value > 0 && conversions_value_total > 0
        ? round2(conversions_value_total / spend_with_value)
        : null,
  };
}

/** Funil comparativo entre canais (Seção 7). LPV só existe no Meta. */
export async function getConversionFunnel(filters: AdSpendFilters): Promise<FunnelRow[]> {
  const supabase = await createClient();
  let q = marketingSchema(supabase)
    .from("v_ads_daily")
    .select("platform_slug, impressions, clicks, conversions, landing_page_views")
    .gte("data_referencia", filters.date_from)
    .lte("data_referencia", filters.date_to);
  if (filters.platforms?.length) q = q.in("platform_slug", filters.platforms);

  const { data, error } = await q;
  if (error) throw error;

  const map = new Map<AdPlatformSlug, FunnelRow & { _hasLpv: boolean }>();
  for (const raw of (data ?? []) as Array<{
    platform_slug: AdPlatformSlug;
    impressions: number | null;
    clicks: number | null;
    conversions: number | null;
    landing_page_views: number | null;
  }>) {
    const acc =
      map.get(raw.platform_slug) ??
      ({
        platform_slug: raw.platform_slug,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        landing_page_views: 0,
        _hasLpv: false,
      } as FunnelRow & { _hasLpv: boolean });
    acc.impressions += num(raw.impressions);
    acc.clicks += num(raw.clicks);
    acc.conversions += num(raw.conversions);
    if (raw.landing_page_views != null) {
      acc.landing_page_views = num(acc.landing_page_views) + num(raw.landing_page_views);
      acc._hasLpv = true;
    }
    map.set(raw.platform_slug, acc);
  }

  return [...map.values()].map(({ _hasLpv, ...row }) => ({
    ...row,
    landing_page_views: _hasLpv ? row.landing_page_views : null,
  }));
}

/** Série temporal de uma métrica derivada (CPC/CPM/CTR) por plataforma. */
export async function getTrend(
  filters: AdSpendFilters,
  metric: TrendMetric,
): Promise<TrendPoint[]> {
  const supabase = await createClient();
  let q = marketingSchema(supabase)
    .from("v_ads_daily")
    .select("platform_slug, data_referencia, impressions, clicks, spend")
    .gte("data_referencia", filters.date_from)
    .lte("data_referencia", filters.date_to);
  if (filters.platforms?.length) q = q.in("platform_slug", filters.platforms);

  const { data, error } = await q;
  if (error) throw error;

  // Agrupa por data × plataforma somando os brutos antes de derivar a métrica.
  const byDate = new Map<
    string,
    Map<AdPlatformSlug, { impressions: number; clicks: number; spend: number }>
  >();
  for (const r of (data ?? []) as Array<{
    platform_slug: AdPlatformSlug;
    data_referencia: string;
    impressions: number | null;
    clicks: number | null;
    spend: number | null;
  }>) {
    const day = byDate.get(r.data_referencia) ?? new Map();
    const acc = day.get(r.platform_slug) ?? { impressions: 0, clicks: 0, spend: 0 };
    acc.impressions += num(r.impressions);
    acc.clicks += num(r.clicks);
    acc.spend += num(r.spend);
    day.set(r.platform_slug, acc);
    byDate.set(r.data_referencia, day);
  }

  const derive = (a: { impressions: number; clicks: number; spend: number }) => {
    if (metric === "ctr")
      return a.impressions > 0 ? round2((a.clicks / a.impressions) * 100) : null;
    if (metric === "cpc") return a.clicks > 0 ? round2(a.spend / a.clicks) : null;
    return a.impressions > 0 ? round2((a.spend / a.impressions) * 1000) : null;
  };

  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, platforms]) => {
      const point: TrendPoint = { data_referencia: date };
      for (const [slug, agg] of platforms) point[slug] = derive(agg);
      return point;
    });
}

/** Métricas específicas da plataforma — consulta a tabela base (Seção 6.4). */
export async function getPlatformCampaigns(
  slug: AdPlatformSlug,
  filters: AdSpendFilters,
): Promise<Record<string, unknown>[]> {
  const supabase = await createClient();
  const table =
    slug === "meta_ads"
      ? "meta_ads_ad_insights"
      : slug === "google_ads"
        ? "google_ads_ad_insights"
        : "linkedin_ads_creative_insights";

  let q = marketingSchema(supabase)
    .from(table)
    .select("*")
    .gte("data_referencia", filters.date_from)
    .lte("data_referencia", filters.date_to);
  if (filters.search) q = q.ilike("campaign_name", `%${filters.search}%`);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Record<string, unknown>[];
}

/**
 * Saúde da integração. A "última sincronização" vem da última data de coleta
 * (coletado_em) dos próprios insights — o sync_runs do n8n ainda não registra
 * execuções, então usamos o dado coletado como sinal de saúde, com o status do
 * sync_runs apenas como informação complementar quando existir.
 */
export async function getIntegrationHealth(): Promise<IntegrationHealthRow[]> {
  const supabase = await createClient();

  const [{ data: rows, error }, { data: syncRows }] = await Promise.all([
    marketingSchema(supabase)
      .from("v_ads_daily")
      .select("platform_slug, coletado_em, data_referencia")
      .order("coletado_em", { ascending: false }),
    marketingSchema(supabase)
      .from("sync_runs")
      .select("status, started_at, platforms!inner(slug, category)")
      .eq("platforms.category", "ads")
      .order("started_at", { ascending: false }),
  ]);
  if (error) throw error;

  const latestStatus = new Map<AdPlatformSlug, string>();
  for (const raw of (syncRows ?? []) as Array<Record<string, unknown>>) {
    const platform = raw.platforms as { slug: string } | { slug: string }[] | null;
    const slug = (Array.isArray(platform) ? platform[0]?.slug : platform?.slug) as
      | AdPlatformSlug
      | undefined;
    if (slug && !latestStatus.has(slug) && raw.status)
      latestStatus.set(slug, String(raw.status));
  }

  const agg = new Map<AdPlatformSlug, IntegrationHealthRow>();
  for (const raw of (rows ?? []) as Array<{
    platform_slug: AdPlatformSlug;
    coletado_em: string | null;
    data_referencia: string | null;
  }>) {
    const slug = raw.platform_slug;
    const acc =
      agg.get(slug) ??
      ({
        platform_slug: slug,
        last_collected_at: null,
        last_reference_date: null,
        records: 0,
        status: latestStatus.get(slug) ?? null,
      } as IntegrationHealthRow);
    acc.records += 1;
    if (
      raw.coletado_em &&
      (!acc.last_collected_at || raw.coletado_em > acc.last_collected_at)
    )
      acc.last_collected_at = raw.coletado_em;
    if (
      raw.data_referencia &&
      (!acc.last_reference_date || raw.data_referencia > acc.last_reference_date)
    )
      acc.last_reference_date = raw.data_referencia;
    agg.set(slug, acc);
  }

  return [...agg.values()];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
