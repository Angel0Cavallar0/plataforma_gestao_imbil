/**
 * Tipos do submódulo mkt_midia-paga (Gestão de Mídia Paga).
 * Submódulo somente leitura — espelha as views normalizadas
 * marketing.v_ads_daily / v_campaigns_daily / v_platforms_summary
 * e as tabelas base de cada plataforma.
 */

export type AdPlatformSlug = "meta_ads" | "google_ads" | "linkedin_ads";

export type AdManagerLevel = "account" | "campaign" | "ad";

/** Uma linha da view marketing.v_platforms_summary. */
export type PlatformSummary = {
  platform_slug: AdPlatformSlug;
  campaigns_total: number;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  conversions_value: number | null;
  first_date: string | null;
  last_date: string | null;
};

/** KPIs consolidados da visão geral (cards do topo). */
export type OverviewKpis = {
  /** SUM(spend) de todas as plataformas no período. */
  spend_total: number;
  /** SUM(conversions) de todas as plataformas. */
  conversions_total: number;
  /** SUM(clicks) — usado na taxa de conversão. */
  clicks_total: number;
  /** SUM(conversions_value) apenas de plataformas com valor (Meta + Google). */
  conversions_value_total: number;
  /** spend apenas das plataformas com valor de conversão (denominador do ROAS). */
  spend_with_value: number;
  /** spend do LinkedIn (sem retorno mensurável) — nota de rodapé. */
  spend_without_value: number;
  /** Custo por resultado consolidado = spend_total / conversions_total. */
  cost_per_conversion: number | null;
  /** Taxa de conversão = conversions_total / clicks_total × 100. */
  conversion_rate_pct: number | null;
  /** ROAS = conversions_value_total / spend_with_value (Meta + Google). */
  roas: number | null;
};

/** Uma linha agregada da tabela unificada de campanhas (v_campaigns_daily somado no período). */
export type CampaignRow = {
  platform_slug: AdPlatformSlug;
  external_campaign_id: string;
  campaign_name: string | null;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  conversions_value: number | null;
  ctr_pct: number | null;
  cpc: number | null;
  cpm: number | null;
  cost_per_conversion: number | null;
  conversion_rate_pct: number | null;
  /** null para LinkedIn (sem valor de conversão) ou quando não há valor no período. */
  roas: number | null;
};

/** Etapa do funil por plataforma. */
export type FunnelRow = {
  platform_slug: AdPlatformSlug;
  impressions: number;
  clicks: number;
  /** Apenas Meta fornece LPV; null nas demais. */
  landing_page_views: number | null;
  conversions: number;
};

/** Ponto da série temporal de tendência (CPC/CPM/CTR). */
export type TrendPoint = {
  data_referencia: string;
  /** chave dinâmica por plataforma → valor da métrica. */
  [platform: string]: number | string | null;
};

export type TrendMetric = "cpc" | "cpm" | "ctr";

/**
 * Saúde da integração. Como o sync_runs (n8n) ainda não registra execuções,
 * a "última sincronização" é derivada da última data de coleta (coletado_em)
 * dos próprios insights, com fallback para o registro de sync_runs.
 */
export type IntegrationHealthRow = {
  platform_slug: AdPlatformSlug;
  /** coletado_em mais recente entre os insights da plataforma. */
  last_collected_at: string | null;
  /** data_referencia mais recente coberta pelos dados. */
  last_reference_date: string | null;
  /** nº de linhas (ad/creative × dia) já coletadas. */
  records: number;
  /** status reportado pelo sync_runs, se houver. */
  status: string | null;
};

export type AdSpendFilters = {
  date_from: string; // ISO yyyy-mm-dd
  date_to: string; // ISO yyyy-mm-dd
  platforms?: AdPlatformSlug[];
  search?: string;
};
