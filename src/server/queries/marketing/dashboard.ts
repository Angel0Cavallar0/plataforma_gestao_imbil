import { createClient } from "@/lib/supabase/server";
import { marketingSchema } from "@/lib/supabase/marketing";
import { normalizeSource } from "@/lib/marketing/dashboard";
import type {
  AlertRule,
  AlertsBySource,
  AlertsKpis,
  CompetitorsKpis,
  ContentKpis,
  ConversionFunnelRow,
  DashboardAlert,
  DashboardPeriod,
  EventsKpis,
  EventsPipelineRow,
  FollowersSeriesPoint,
  InsightsKpis,
  InvestmentByPlatform,
  InvestmentCompositionSlice,
  InvestmentKpis,
  InvestmentReturnRow,
  PaidKpis,
  PostsByPlatform,
  RelevantDate,
  ReportHighlights,
  SearchPositionHeatmapData,
  SiteSessionsPoint,
  TrendsBenchmarkSeries,
  UpcomingEvent,
  YtBenchmarkRow,
} from "@/types/marketing-dashboard";

/** Resultado padrão dos KPIs com período atual + anterior (para deltas). */
export type KpiPair<T> = { current: T; previous: T };

type RpcName =
  | "dashboard_content_kpis"
  | "dashboard_paid_kpis"
  | "dashboard_investment_kpis"
  | "dashboard_events_kpis"
  | "dashboard_insights_kpis"
  | "dashboard_competitors_kpis"
  | "dashboard_alerts_kpis";

/** Chama uma função dashboard_*_kpis para o período atual e o anterior. */
async function kpiPair<T>(fn: RpcName, period: DashboardPeriod): Promise<KpiPair<T>> {
  const supabase = await createClient();
  const schema = marketingSchema(supabase);
  const [cur, prev] = await Promise.all([
    schema.rpc(fn, { p_from: period.from, p_to: period.to }),
    schema.rpc(fn, { p_from: period.prevFrom, p_to: period.prevTo }),
  ]);
  if (cur.error) throw cur.error;
  if (prev.error) throw prev.error;
  return {
    current: (cur.data ?? {}) as unknown as T,
    previous: (prev.data ?? {}) as unknown as T,
  };
}

// =========================================================
// KPIs por categoria
// =========================================================

export function getContentKpis(period: DashboardPeriod) {
  return kpiPair<ContentKpis>("dashboard_content_kpis", period);
}
export function getPaidKpis(period: DashboardPeriod) {
  return kpiPair<PaidKpis>("dashboard_paid_kpis", period);
}
export function getInvestmentKpis(period: DashboardPeriod) {
  return kpiPair<InvestmentKpis>("dashboard_investment_kpis", period);
}
export function getEventsKpis(period: DashboardPeriod) {
  return kpiPair<EventsKpis>("dashboard_events_kpis", period);
}
export function getInsightsKpis(period: DashboardPeriod) {
  return kpiPair<InsightsKpis>("dashboard_insights_kpis", period);
}
export function getCompetitorsKpis(period: DashboardPeriod) {
  return kpiPair<CompetitorsKpis>("dashboard_competitors_kpis", period);
}
export function getAlertsKpis(period: DashboardPeriod) {
  return kpiPair<AlertsKpis>("dashboard_alerts_kpis", period);
}

// =========================================================
// Conteúdo — gráficos
// =========================================================

const FOLLOWER_NETWORKS = ["instagram", "facebook", "linkedin"] as const;

export async function getFollowersSeries(
  period: DashboardPeriod,
): Promise<FollowersSeriesPoint[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("v_followers_history")
    .select("network, data_referencia, total_followers")
    .gte("data_referencia", period.from)
    .lte("data_referencia", period.to)
    .order("data_referencia");
  if (error) throw error;

  const rows = (data ?? []) as unknown as {
    network: string;
    data_referencia: string;
    total_followers: number | null;
  }[];

  const byDate = new Map<string, FollowersSeriesPoint>();
  for (const r of rows) {
    const date = r.data_referencia;
    if (!byDate.has(date)) {
      byDate.set(date, { date, instagram: null, facebook: null, linkedin: null });
    }
    const point = byDate.get(date)!;
    const net = r.network?.toLowerCase();
    if ((FOLLOWER_NETWORKS as readonly string[]).includes(net)) {
      point[net as (typeof FOLLOWER_NETWORKS)[number]] = r.total_followers;
    }
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export async function getPostsByPlatform(
  period: DashboardPeriod,
): Promise<PostsByPlatform[]> {
  const supabase = await createClient();
  const schema = marketingSchema(supabase);
  const [postsRes, platformsRes] = await Promise.all([
    schema
      .from("content_posts")
      .select("platform_id")
      .eq("status", "publicado")
      .gte("published_at", `${period.from}T00:00:00`)
      .lte("published_at", `${period.to}T23:59:59`),
    schema.from("platforms").select("id, name"),
  ]);
  if (postsRes.error) throw postsRes.error;
  if (platformsRes.error) throw platformsRes.error;

  const names = new Map<string, string>();
  for (const p of (platformsRes.data ?? []) as unknown as {
    id: string;
    name: string;
  }[]) {
    names.set(p.id, p.name);
  }

  const counts = new Map<string, number>();
  for (const post of (postsRes.data ?? []) as unknown as {
    platform_id: string | null;
  }[]) {
    const name = (post.platform_id && names.get(post.platform_id)) || "Outros";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()].map(([platform, count]) => ({ platform, count }));
}

// =========================================================
// Mídia paga — gráficos
// =========================================================

type CampaignDailyRow = {
  platform_slug: string;
  spend: number | null;
  impressions: number | null;
  clicks: number | null;
  conversions: number | null;
  conversions_value: number | null;
};

async function getCampaignsDaily(period: DashboardPeriod): Promise<CampaignDailyRow[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("v_campaigns_daily")
    .select("platform_slug, spend, impressions, clicks, conversions, conversions_value")
    .gte("data_referencia", period.from)
    .lte("data_referencia", period.to);
  if (error) throw error;
  return (data ?? []) as unknown as CampaignDailyRow[];
}

const PLATFORM_LABELS: Record<string, string> = {
  meta_ads: "Meta",
  google_ads: "Google",
  linkedin_ads: "LinkedIn",
};

export async function getInvestmentByPlatform(
  period: DashboardPeriod,
): Promise<InvestmentByPlatform[]> {
  const rows = await getCampaignsDaily(period);
  const byPlatform = new Map<string, number>();
  for (const r of rows) {
    const label = PLATFORM_LABELS[r.platform_slug] ?? r.platform_slug;
    byPlatform.set(label, (byPlatform.get(label) ?? 0) + (r.spend ?? 0));
  }
  return [...byPlatform.entries()].map(([platform, spend]) => ({ platform, spend }));
}

export async function getConversionFunnel(
  period: DashboardPeriod,
): Promise<ConversionFunnelRow[]> {
  const rows = await getCampaignsDaily(period);
  const acc = new Map<string, ConversionFunnelRow>();
  for (const r of rows) {
    const platform = PLATFORM_LABELS[r.platform_slug] ?? r.platform_slug;
    const cur = acc.get(platform) ?? {
      platform,
      impressions: 0,
      clicks: 0,
      conversions: 0,
    };
    cur.impressions += r.impressions ?? 0;
    cur.clicks += r.clicks ?? 0;
    cur.conversions += r.conversions ?? 0;
    acc.set(platform, cur);
  }
  return [...acc.values()];
}

// =========================================================
// Investimento geral — composição e tabela
// =========================================================

async function getEventsInvestment(period: DashboardPeriod): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("event_costs")
    .select("amount")
    .gte("paid_at", period.from)
    .lte("paid_at", period.to);
  if (error) throw error;
  return ((data ?? []) as unknown as { amount: number | null }[]).reduce(
    (s, r) => s + (r.amount ?? 0),
    0,
  );
}

export async function getInvestmentComposition(
  period: DashboardPeriod,
): Promise<InvestmentCompositionSlice[]> {
  const [ads, eventsInvestment] = await Promise.all([
    getInvestmentByPlatform(period),
    getEventsInvestment(period),
  ]);
  const slices: InvestmentCompositionSlice[] = ads.map((a) => ({
    name: a.platform,
    value: a.spend,
  }));
  if (eventsInvestment > 0) slices.push({ name: "Eventos", value: eventsInvestment });
  return slices.filter((s) => s.value > 0);
}

export async function getInvestmentReturnTable(
  period: DashboardPeriod,
): Promise<InvestmentReturnRow[]> {
  const rows = await getCampaignsDaily(period);
  const acc = new Map<string, { investment: number; result: number }>();
  for (const r of rows) {
    const channel = PLATFORM_LABELS[r.platform_slug] ?? r.platform_slug;
    const cur = acc.get(channel) ?? { investment: 0, result: 0 };
    cur.investment += r.spend ?? 0;
    cur.result += r.conversions_value ?? 0;
    acc.set(channel, cur);
  }

  const result: InvestmentReturnRow[] = [...acc.entries()].map(([channel, v]) => ({
    channel,
    investment: v.investment,
    result: v.result,
    cost_per_result: v.result > 0 ? v.investment / v.result : null,
  }));

  const eventsInvestment = await getEventsInvestment(period);
  if (eventsInvestment > 0) {
    result.push({
      channel: "Eventos",
      investment: eventsInvestment,
      result: 0,
      cost_per_result: null,
    });
  }
  return result;
}

// =========================================================
// Eventos — pipeline e timeline
// =========================================================

export async function getEventsPipeline(): Promise<EventsPipelineRow[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase).from("events").select("status");
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const e of (data ?? []) as unknown as { status: string | null }[]) {
    if (!e.status) continue;
    counts.set(e.status, (counts.get(e.status) ?? 0) + 1);
  }
  return [...counts.entries()].map(([status, count]) => ({ status, count }));
}

export async function getUpcomingEvents(): Promise<UpcomingEvent[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await marketingSchema(supabase)
    .from("events")
    .select("id, name, edition, starts_on, city, state, status")
    .gte("starts_on", today)
    .neq("status", "cancelado")
    .order("starts_on")
    .limit(8);
  if (error) throw error;
  return (data ?? []) as unknown as UpcomingEvent[];
}

// =========================================================
// Insights — sessões, tráfego e relatório
// =========================================================

export async function getSiteSessions(
  period: DashboardPeriod,
): Promise<SiteSessionsPoint[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("google_analytics_daily")
    .select("data_referencia, sessions")
    .gte("data_referencia", period.from)
    .lte("data_referencia", period.to)
    .order("data_referencia");
  if (error) throw error;
  return (
    (data ?? []) as unknown as { data_referencia: string; sessions: number | null }[]
  ).map((r) => ({ date: r.data_referencia, sessions: r.sessions ?? 0 }));
}

export async function getTrafficSources(
  period: DashboardPeriod,
): Promise<InvestmentCompositionSlice[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("google_analytics_traffic_sources")
    .select("channel, sessions")
    .gte("data_referencia", period.from)
    .lte("data_referencia", period.to);
  if (error) throw error;
  const acc = new Map<string, number>();
  for (const r of (data ?? []) as unknown as {
    channel: string | null;
    sessions: number | null;
  }[]) {
    const name = r.channel ?? "Outros";
    acc.set(name, (acc.get(name) ?? 0) + (r.sessions ?? 0));
  }
  return [...acc.entries()]
    .map(([name, value]) => ({ name, value }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
}

export async function getReportHighlights(): Promise<ReportHighlights | null> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("marketing_reports")
    .select("report_json")
    .order("gerado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const json = (data as unknown as { report_json: Record<string, unknown> | null } | null)
    ?.report_json;
  if (!json) return null;
  const toStrings = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : String(x))) : [];
  return {
    destaques: toStrings(json.destaques),
    recomendacoes: toStrings(json.recomendacoes),
  };
}

// =========================================================
// Concorrentes — benchmark
// =========================================================

const IMBIL = "imbil";

export async function getYtBenchmark(): Promise<YtBenchmarkRow[]> {
  const supabase = await createClient();
  const schema = marketingSchema(supabase);
  const [overviewRes, imbilRes] = await Promise.all([
    schema.from("v_competitors_overview").select("name, yt_subscribers"),
    schema
      .from("imbil_youtube_stats")
      .select("subscriber_count")
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (overviewRes.error) throw overviewRes.error;
  if (imbilRes.error) throw imbilRes.error;

  const rows: YtBenchmarkRow[] = (
    (overviewRes.data ?? []) as unknown as {
      name: string;
      yt_subscribers: number | null;
    }[]
  )
    .filter((r) => r.yt_subscribers != null)
    .map((r) => ({ name: r.name, subscribers: r.yt_subscribers ?? 0, isImbil: false }));

  const imbilSubs =
    (imbilRes.data as unknown as { subscriber_count: number | null } | null)
      ?.subscriber_count ?? null;
  if (imbilSubs != null) {
    rows.push({ name: "IMBIL", subscribers: imbilSubs, isImbil: true });
  }
  return rows.sort((a, b) => b.subscribers - a.subscribers);
}

export async function getTrendsBenchmark(
  period: DashboardPeriod,
): Promise<TrendsBenchmarkSeries[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("competitor_trends")
    .select("empresa, data_referencia, interest")
    .gte("data_referencia", period.from)
    .lte("data_referencia", period.to)
    .order("data_referencia");
  if (error) throw error;

  const series = new Map<string, Map<string, number>>();
  for (const r of (data ?? []) as unknown as {
    empresa: string;
    data_referencia: string;
    interest: number | null;
  }[]) {
    if (!series.has(r.empresa)) series.set(r.empresa, new Map());
    const m = series.get(r.empresa)!;
    m.set(r.data_referencia, (m.get(r.data_referencia) ?? 0) + (r.interest ?? 0));
  }

  return [...series.entries()].map(([name, points]) => ({
    name,
    isImbil: name.toLowerCase() === IMBIL,
    points: [...points.entries()]
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  }));
}

export async function getSearchPositionHeatmap(
  period: DashboardPeriod,
): Promise<SearchPositionHeatmapData> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("competitor_keyword_rankings")
    .select("keyword, competitor_name, position")
    .gte("data_referencia", period.from)
    .lte("data_referencia", period.to);
  if (error) throw error;

  const rows = (data ?? []) as unknown as {
    keyword: string;
    competitor_name: string;
    position: number | null;
  }[];

  const acc = new Map<string, Map<string, { sum: number; n: number }>>();
  const companySet = new Set<string>();
  for (const r of rows) {
    if (r.position == null) continue;
    companySet.add(r.competitor_name);
    if (!acc.has(r.keyword)) acc.set(r.keyword, new Map());
    const m = acc.get(r.keyword)!;
    const cell = m.get(r.competitor_name) ?? { sum: 0, n: 0 };
    cell.sum += r.position;
    cell.n += 1;
    m.set(r.competitor_name, cell);
  }

  // Imbil sempre primeiro na ordem das colunas.
  const companies = [...companySet].sort((a, b) => {
    if (a.toLowerCase() === IMBIL) return -1;
    if (b.toLowerCase() === IMBIL) return 1;
    return a.localeCompare(b);
  });
  const keywords = [...acc.keys()].sort();

  return {
    keywords,
    companies,
    rows: keywords.map((keyword) => {
      const m = acc.get(keyword)!;
      const positions: Record<string, number | null> = {};
      for (const c of companies) {
        const cell = m.get(c);
        positions[c] = cell ? Math.round((cell.sum / cell.n) * 10) / 10 : null;
      }
      return { keyword, positions };
    }),
  };
}

// =========================================================
// Alertas — feed, por fonte e datas relevantes
// =========================================================

export async function getAlertsFeed(period: DashboardPeriod): Promise<DashboardAlert[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("alertas_inteligentes")
    .select(
      "id, data_referencia, fonte, metrica, tipo, desvio_pct, campanha, campaign_id, link",
    )
    .gte("data_referencia", period.from)
    .lte("data_referencia", period.to)
    .order("data_referencia", { ascending: false })
    .limit(50);
  if (error) throw error;

  return ((data ?? []) as unknown as Omit<DashboardAlert, "fonte_normalizada">[])
    .map((a) => ({ ...a, fonte_normalizada: normalizeSource(a.fonte) }))
    .sort((a, b) => Math.abs(b.desvio_pct ?? 0) - Math.abs(a.desvio_pct ?? 0));
}

export async function getAlertsBySource(
  period: DashboardPeriod,
): Promise<AlertsBySource[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("alertas_inteligentes")
    .select("fonte")
    .gte("data_referencia", period.from)
    .lte("data_referencia", period.to);
  if (error) throw error;
  const acc = new Map<string, number>();
  for (const a of (data ?? []) as unknown as { fonte: string | null }[]) {
    const src = normalizeSource(a.fonte);
    acc.set(src, (acc.get(src) ?? 0) + 1);
  }
  return [...acc.entries()].map(([source, count]) => ({ source, count }));
}

/** Datas relevantes próximas (regras tipo data, ativas, ainda por vir). */
export async function getRelevantDates(): Promise<RelevantDate[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await marketingSchema(supabase)
    .from("alert_rules")
    .select("id, name, event_date, remind_days_before, severity")
    .eq("rule_type", "date")
    .eq("is_active", true)
    .gte("event_date", today)
    .order("event_date")
    .limit(10);
  if (error) throw error;
  return (data ?? []) as unknown as RelevantDate[];
}

// =========================================================
// Regras de alerta (gestão)
// =========================================================

export async function getAlertRules(): Promise<AlertRule[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("alert_rules")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AlertRule[];
}
