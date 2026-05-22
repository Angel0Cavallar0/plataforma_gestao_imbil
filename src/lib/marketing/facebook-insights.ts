import type { FacebookPostInsightRow } from "@/types/marketing";
import type { InsightPeriod } from "@/lib/marketing/instagram-insights";

export type { InsightPeriod };

export const FB_TOP_REACH_PAIR = {
  title: "Alcance",
  organicKey: "reach" as const,
  paidKey: "ad_reach" as const,
};

export const FB_CORE_METRICS = ["reactions_total", "comments", "shares"] as const;

export const FB_REACTION_METRICS = [
  "reactions_like",
  "reactions_love",
  "reactions_haha",
  "reactions_wow",
  "reactions_sad",
  "reactions_angry",
] as const;

export const FB_VIDEO_VIEW_METRICS = [
  "video_views",
  "video_views_organic",
  "video_views_paid",
  "video_complete_views",
] as const;

export const FB_VIDEO_OTHER_METRICS = ["video_avg_watch_time"] as const;

export const FB_PAID_METRICS = ["ad_spend"] as const;

export type FbCoreMetricKey = (typeof FB_CORE_METRICS)[number];
export type FbReactionMetricKey = (typeof FB_REACTION_METRICS)[number];
export type FbVideoViewMetricKey = (typeof FB_VIDEO_VIEW_METRICS)[number];
export type FbVideoOtherMetricKey = (typeof FB_VIDEO_OTHER_METRICS)[number];
export type FbVideoMetricKey = FbVideoViewMetricKey | FbVideoOtherMetricKey;
export type FbPaidMetricKey = (typeof FB_PAID_METRICS)[number];
export type FbUnifiedOrganicKey = "reach";
export type FbUnifiedPaidKey = "ad_reach";
export type FbTopMetricKey = "engaged_users";
export type FbMetricKey =
  | FbCoreMetricKey
  | FbReactionMetricKey
  | FbVideoMetricKey
  | FbPaidMetricKey
  | FbUnifiedOrganicKey
  | FbUnifiedPaidKey
  | FbTopMetricKey
  | "impressions"
  | "ad_impressions"
  | "clicks";

export const FB_METRIC_LABELS: Record<FbMetricKey, string> = {
  reach: "Alcance",
  impressions: "Impressões",
  ad_reach: "Alcance pago",
  ad_impressions: "Impressões pagas",
  engaged_users: "Usuários engajados",
  reactions_total: "Reações",
  reactions_like: "Curtidas",
  reactions_love: "Amei",
  reactions_haha: "Haha",
  reactions_wow: "Uau",
  reactions_sad: "Triste",
  reactions_angry: "Grr",
  comments: "Comentários",
  shares: "Compartilhamentos",
  clicks: "Cliques",
  video_views: "Views totais",
  video_views_organic: "Views orgânicas",
  video_views_paid: "Views pagas",
  video_complete_views: "Views completas",
  video_avg_watch_time: "Tempo médio de exibição",
  ad_spend: "Investimento",
};

export const FB_REACTION_COLORS: Record<FbReactionMetricKey, string> = {
  reactions_like: "#1877F2",
  reactions_love: "#e4405f",
  reactions_haha: "#f59e0b",
  reactions_wow: "#a855f7",
  reactions_sad: "#6366f1",
  reactions_angry: "#ef4444",
};

export const FB_VIDEO_VIEW_COLORS: Record<FbVideoViewMetricKey, string> = {
  video_views: "#1877F2",
  video_views_organic: "#22c55e",
  video_views_paid: "#f97316",
  video_complete_views: "#a855f7",
};

export const ORGANIC_LINE_COLOR = "#3b82f6";
export const PAID_LINE_COLOR = "#f97316";
export const ENGAGEMENT_RATE_COLOR = "#0d9488";

function dateLabel(dataReferencia: string): string {
  return new Date(`${dataReferencia}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function truncateMessage(message: string | null, max = 60): string {
  if (!message?.trim()) return "Publicação Facebook";
  const line = message.trim().split("\n")[0] ?? "";
  return line.length > max ? `${line.slice(0, max)}…` : line;
}

export function hasBoostedHistory(history: FacebookPostInsightRow[]): boolean {
  return history.some((r) => r.is_boosted === true);
}

export function isVideoPostType(postType: string | null): boolean {
  const t = (postType ?? "").toLowerCase();
  return t === "video" || t === "reels" || t.includes("video");
}

export function engagementRatePercent(reach: number, engagedUsers: number): number {
  if (reach <= 0) return 0;
  return (engagedUsers / reach) * 100;
}

export function engagementRateFromHistory(history: FacebookPostInsightRow[]): number {
  if (history.length === 0) return 0;
  const last = history[history.length - 1]!;
  return engagementRatePercent(Number(last.reach ?? 0), Number(last.engaged_users ?? 0));
}

export function formatEngagementRate(value: number): string {
  return (
    value.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + "%"
  );
}

function parseDate(d: string): Date {
  return new Date(`${d}T12:00:00`);
}

function weekKey(d: string): string {
  const date = parseDate(d);
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return start.toISOString().slice(0, 10);
}

function monthKey(d: string): string {
  return d.slice(0, 7);
}

export function filterInsightHistory(
  history: FacebookPostInsightRow[],
  period: InsightPeriod,
): FacebookPostInsightRow[] {
  const sorted = [...history].sort((a, b) =>
    a.data_referencia.localeCompare(b.data_referencia),
  );
  if (period === "total") return sorted;

  const now = new Date();
  const cutoff = new Date(now);
  if (period === "days") cutoff.setDate(cutoff.getDate() - 7);
  else if (period === "weeks") cutoff.setDate(cutoff.getDate() - 28);
  else cutoff.setMonth(cutoff.getMonth() - 6);

  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const inRange = sorted.filter((r) => r.data_referencia >= cutoffStr);

  if (period === "days") return inRange;

  const buckets = new Map<string, FacebookPostInsightRow>();
  for (const row of inRange) {
    const key =
      period === "weeks" ? weekKey(row.data_referencia) : monthKey(row.data_referencia);
    const existing = buckets.get(key);
    if (!existing || row.data_referencia > existing.data_referencia) {
      buckets.set(key, row);
    }
  }
  return [...buckets.values()].sort((a, b) =>
    a.data_referencia.localeCompare(b.data_referencia),
  );
}

export function metricValue(history: FacebookPostInsightRow[], key: FbMetricKey): number {
  if (history.length === 0) return 0;
  const last = history[history.length - 1]!;
  return Number(last[key as keyof FacebookPostInsightRow] ?? 0);
}

export function chartDataForMetric(history: FacebookPostInsightRow[], key: FbMetricKey) {
  return history.map((row) => ({
    date: row.data_referencia,
    label: dateLabel(row.data_referencia),
    value: Number(row[key as keyof FacebookPostInsightRow] ?? 0),
  }));
}

export function chartDataEngagementRate(history: FacebookPostInsightRow[]) {
  return history.map((row) => ({
    date: row.data_referencia,
    label: dateLabel(row.data_referencia),
    value: engagementRatePercent(Number(row.reach ?? 0), Number(row.engaged_users ?? 0)),
  }));
}

export function chartDataUnifiedOrganicPaid(
  history: FacebookPostInsightRow[],
  organicKey: FbUnifiedOrganicKey,
  paidKey: FbUnifiedPaidKey,
) {
  return history.map((row) => ({
    date: row.data_referencia,
    label: dateLabel(row.data_referencia),
    organic: Number(row[organicKey] ?? 0),
    paid: Number(row[paidKey] ?? 0),
  }));
}

export function chartDataReactionsMultiLine(history: FacebookPostInsightRow[]) {
  return history.map((row) => {
    const point: Record<string, string | number> = {
      date: row.data_referencia,
      label: dateLabel(row.data_referencia),
    };
    for (const key of FB_REACTION_METRICS) {
      point[key] = Number(row[key] ?? 0);
    }
    return point;
  });
}

/** Reações com pelo menos um valor > 0 no histórico (para linhas e legenda). */
export function reactionMetricsWithData(
  history: FacebookPostInsightRow[],
): FbReactionMetricKey[] {
  return FB_REACTION_METRICS.filter((key) =>
    history.some((row) => Number(row[key] ?? 0) > 0),
  );
}

/** Domínio Y com folga quando todos os pontos têm o mesmo valor (evita linha invisível). */
export function chartYDomain(values: number[]): [number, number] {
  if (values.length === 0) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    const pad = min === 0 ? 1 : Math.max(1, Math.ceil(min * 0.1));
    return [Math.max(0, min - pad), max + pad];
  }
  return [Math.max(0, min), max];
}

export function chartDataVideoViewsMultiLine(history: FacebookPostInsightRow[]) {
  return history.map((row) => {
    const point: Record<string, string | number> = {
      date: row.data_referencia,
      label: dateLabel(row.data_referencia),
    };
    for (const key of FB_VIDEO_VIEW_METRICS) {
      point[key] = Number(row[key] ?? 0);
    }
    return point;
  });
}

export function formatMetricValue(key: FbMetricKey, value: number): string {
  if (key === "ad_spend") {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  if (key === "video_avg_watch_time") {
    return `${Math.round(value)}s`;
  }
  return value.toLocaleString("pt-BR");
}
