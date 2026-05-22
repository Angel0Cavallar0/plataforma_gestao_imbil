import type { FacebookPostInsightRow } from "@/types/marketing";
import type { InsightPeriod } from "@/lib/marketing/instagram-insights";

export type { InsightPeriod };

export const FB_UNIFIED_METRIC_PAIRS = [
  { title: "Alcance", organicKey: "reach" as const, paidKey: "ad_reach" as const },
  {
    title: "Impressões",
    organicKey: "impressions" as const,
    paidKey: "ad_impressions" as const,
  },
] as const;

export const FB_CORE_METRICS = [
  "engaged_users",
  "reactions_total",
  "comments",
  "shares",
  "clicks",
] as const;

export const FB_REACTION_METRICS = [
  "reactions_like",
  "reactions_love",
  "reactions_haha",
  "reactions_wow",
  "reactions_sad",
  "reactions_angry",
] as const;

export const FB_VIDEO_METRICS = [
  "video_views",
  "video_views_organic",
  "video_views_paid",
  "video_complete_views",
  "video_avg_watch_time",
] as const;

export const FB_PAID_METRICS = ["ad_spend"] as const;

export type FbCoreMetricKey = (typeof FB_CORE_METRICS)[number];
export type FbReactionMetricKey = (typeof FB_REACTION_METRICS)[number];
export type FbVideoMetricKey = (typeof FB_VIDEO_METRICS)[number];
export type FbPaidMetricKey = (typeof FB_PAID_METRICS)[number];
export type FbUnifiedOrganicKey = "reach" | "impressions";
export type FbUnifiedPaidKey = "ad_reach" | "ad_impressions";
export type FbMetricKey =
  | FbCoreMetricKey
  | FbReactionMetricKey
  | FbVideoMetricKey
  | FbPaidMetricKey
  | FbUnifiedOrganicKey
  | FbUnifiedPaidKey;

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
  video_views: "Visualizações de vídeo",
  video_views_organic: "Views orgânicas",
  video_views_paid: "Views pagas",
  video_complete_views: "Views completas",
  video_avg_watch_time: "Tempo médio de exibição",
  ad_spend: "Investimento",
};

export const ORGANIC_LINE_COLOR = "#3b82f6";
export const PAID_LINE_COLOR = "#f97316";

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
  return Number(last[key] ?? 0);
}

export function chartDataForMetric(history: FacebookPostInsightRow[], key: FbMetricKey) {
  return history.map((row) => ({
    date: row.data_referencia,
    label: new Date(`${row.data_referencia}T12:00:00`).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    }),
    value: Number(row[key] ?? 0),
  }));
}

export function chartDataUnifiedOrganicPaid(
  history: FacebookPostInsightRow[],
  organicKey: FbUnifiedOrganicKey,
  paidKey: FbUnifiedPaidKey,
) {
  return history.map((row) => ({
    date: row.data_referencia,
    label: new Date(`${row.data_referencia}T12:00:00`).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    }),
    organic: Number(row[organicKey] ?? 0),
    paid: Number(row[paidKey] ?? 0),
  }));
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
