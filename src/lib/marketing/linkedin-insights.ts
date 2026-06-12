import type { LinkedInPostInsightRow } from "@/types/marketing";
import type { InsightPeriod } from "@/lib/marketing/instagram-insights";

export type { InsightPeriod };

export const LI_BRAND_COLOR = "#0a66c2";

export const LI_CORE_METRICS = [
  "impressions",
  "unique_impressions",
  "clicks",
  "likes",
  "comments",
  "shares",
] as const;

export const LI_VIDEO_METRICS = [
  "video_views",
  "video_completions",
  "video_view_rate",
] as const;

export type LiCoreMetricKey = (typeof LI_CORE_METRICS)[number];
export type LiVideoMetricKey = (typeof LI_VIDEO_METRICS)[number];
export type LiMetricKey = LiCoreMetricKey | LiVideoMetricKey | "engagement";

export const LI_METRIC_LABELS: Record<LiMetricKey, string> = {
  impressions: "Impressões",
  unique_impressions: "Impressões únicas",
  clicks: "Cliques",
  likes: "Curtidas",
  comments: "Comentários",
  shares: "Compartilhamentos",
  engagement: "Engajamento",
  video_views: "Views de vídeo",
  video_completions: "Views completas",
  video_view_rate: "Taxa de conclusão",
};

export const LI_METRIC_COLORS: Record<LiMetricKey, string> = {
  impressions: "#0a66c2",
  unique_impressions: "#22c55e",
  clicks: "#f59e0b",
  likes: "#e4405f",
  comments: "#a855f7",
  shares: "#06b6d4",
  engagement: "#0d9488",
  video_views: "#0a66c2",
  video_completions: "#a855f7",
  video_view_rate: "#0d9488",
};

/** Métricas armazenadas como fração 0–1, exibidas em percentual. */
const PERCENT_METRICS: ReadonlySet<LiMetricKey> = new Set([
  "engagement",
  "video_view_rate",
]);

export function truncateText(text: string | null, max = 60): string {
  if (!text?.trim()) return "Publicação LinkedIn";
  const line = text.trim().split("\n")[0] ?? "";
  return line.length > max ? `${line.slice(0, max)}…` : line;
}

export function isVideoPostType(postType: string | null): boolean {
  return (postType ?? "").toLowerCase().includes("video");
}

function dateLabel(dataReferencia: string): string {
  return new Date(`${dataReferencia}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
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
  history: LinkedInPostInsightRow[],
  period: InsightPeriod,
): LinkedInPostInsightRow[] {
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

  const buckets = new Map<string, LinkedInPostInsightRow>();
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

export function metricValue(
  history: LinkedInPostInsightRow[],
  key: LiMetricKey,
): number {
  if (history.length === 0) return 0;
  const last = history[history.length - 1]!;
  return Number(last[key] ?? 0);
}

export function chartDataForMetric(
  history: LinkedInPostInsightRow[],
  key: LiMetricKey,
) {
  return history.map((row) => ({
    date: row.data_referencia,
    label: dateLabel(row.data_referencia),
    value: PERCENT_METRICS.has(key)
      ? Number(row[key] ?? 0) * 100
      : Number(row[key] ?? 0),
  }));
}

export function formatMetricValue(key: LiMetricKey, value: number): string {
  if (PERCENT_METRICS.has(key)) {
    return (
      value.toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }) + "%"
    );
  }
  return value.toLocaleString("pt-BR");
}

/** Valor atual já na escala de exibição (percentuais convertidos de fração). */
export function displayMetricValue(
  history: LinkedInPostInsightRow[],
  key: LiMetricKey,
): number {
  const raw = metricValue(history, key);
  return PERCENT_METRICS.has(key) ? raw * 100 : raw;
}
