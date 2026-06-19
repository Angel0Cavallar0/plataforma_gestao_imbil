// Tipos do Dashboard de Marketing (visão executiva consolidada).

/** Período resolvido com o período anterior equivalente (para deltas ▲▼). */
export type DashboardPeriod = {
  /** Início do período atual (YYYY-MM-DD). */
  from: string;
  /** Fim do período atual (YYYY-MM-DD). */
  to: string;
  /** Início do período anterior equivalente. */
  prevFrom: string;
  /** Fim do período anterior equivalente. */
  prevTo: string;
  /** Preset selecionado (ou "custom"). */
  preset: PeriodPreset;
};

export type PeriodPreset =
  | "today"
  | "7d"
  | "30d"
  | "this_month"
  | "last_month"
  | "custom";

/** Par valor atual / anterior usado nos cards com delta. */
export type Delta = {
  current: number;
  previous: number;
};

// --- KPIs por categoria (espelham o jsonb das funções dashboard_*_kpis) ---

export type ContentKpis = {
  posts_publicados: number;
  posts_agendados: number;
  seguidores_total: number;
  seguidores_ganhos: number;
  alcance_organico: number;
  engajamento_medio: number;
};

export type PaidKpis = {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cost_per_result: number;
  roas: number;
};

export type InvestmentKpis = {
  ads_investment: number;
  events_investment: number;
  total_investment: number;
  ads_leads: number;
  events_leads: number;
  cost_per_lead: number;
  estimated_return: number;
};

export type EventsKpis = {
  por_status: Record<string, number>;
  leads_periodo: number;
  cpl: number;
  roi_medio: number;
  proximo_evento: {
    id: string;
    name: string;
    edition: string | null;
    starts_on: string;
    city: string | null;
    state: string | null;
  } | null;
};

export type InsightsKpis = {
  sessions: number;
  youtube_subscribers: number;
  brand_mentions: number;
  avg_rating: number | null;
  ultimo_relatorio: {
    id: string;
    tipo: string;
    gerado_em: string;
    periodo_inicio: string | null;
    periodo_fim: string | null;
  } | null;
};

export type CompetitorsKpis = {
  ativos: number;
  imbil_position: number | null;
  competitors_position: number | null;
  share_of_interest: number;
  imbil_rating: number | null;
  competitors_rating: number | null;
  yt_leader: { name: string; yt_subscribers: number } | null;
};

export type AlertsKpis = {
  total: number;
  criticos: number;
  por_fonte: Record<string, number>;
};

// --- Séries para gráficos ---

export type FollowersSeriesPoint = {
  date: string;
  instagram: number | null;
  facebook: number | null;
  linkedin: number | null;
};

export type PostsByPlatform = { platform: string; count: number };

export type InvestmentByPlatform = { platform: string; spend: number };

export type ConversionFunnelRow = {
  platform: string;
  impressions: number;
  clicks: number;
  conversions: number;
};

export type InvestmentCompositionSlice = { name: string; value: number };

export type InvestmentReturnRow = {
  channel: string;
  investment: number;
  result: number;
  cost_per_result: number | null;
};

export type EventsPipelineRow = { status: string; count: number };

export type UpcomingEvent = {
  id: string;
  name: string;
  edition: string | null;
  starts_on: string;
  city: string | null;
  state: string | null;
  status: string;
};

export type SiteSessionsPoint = { date: string; sessions: number };

export type ReportHighlights = {
  destaques: string[];
  recomendacoes: string[];
};

export type YtBenchmarkRow = { name: string; subscribers: number; isImbil: boolean };

export type TrendsBenchmarkSeries = {
  name: string;
  isImbil: boolean;
  points: { date: string; value: number }[];
};

export type SearchPositionCell = {
  keyword: string;
  positions: Record<string, number | null>;
};

export type SearchPositionHeatmapData = {
  keywords: string[];
  companies: string[];
  rows: SearchPositionCell[];
};

export type DashboardAlert = {
  id: number;
  data_referencia: string;
  fonte: string;
  fonte_normalizada: string;
  metrica: string | null;
  tipo: string | null;
  desvio_pct: number | null;
  campanha: string | null;
  campaign_id: string | null;
  link: string | null;
};

export type RelevantDate = {
  id: string;
  name: string;
  event_date: string;
  remind_days_before: number;
  severity: string;
};

export type AlertsBySource = { source: string; count: number };

// --- Regras de alerta (tabela marketing.alert_rules) ---

export type AlertRuleType = "performance" | "date";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertDirection = "increase" | "decrease" | "any";
export type AlertPeriodWindow = "day" | "week" | "month";

export type AlertRule = {
  id: string;
  name: string;
  rule_type: AlertRuleType;
  source: string | null;
  metric: string | null;
  direction: AlertDirection | null;
  threshold_pct: number | null;
  period_window: AlertPeriodWindow | null;
  event_date: string | null;
  remind_days_before: number | null;
  severity: AlertSeverity;
  is_active: boolean;
  notify_channel: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};
