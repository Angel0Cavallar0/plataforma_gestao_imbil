import type { InstagramMediaInsightRow } from "@/types/marketing";

export type InsightPeriod = "total" | "days" | "weeks" | "months";

export const HIDDEN_METRICS = ["replies", "exits", "taps_forward", "taps_back"] as const;

export const ORGANIC_METRICS = [
  "reach",
  "impressions",
  "likes",
  "comments",
  "saves",
  "shares",
  "plays",
] as const;

export const PAID_METRICS = ["ad_spend", "ad_impressions", "ad_reach"] as const;

export type OrganicMetricKey = (typeof ORGANIC_METRICS)[number];
export type PaidMetricKey = (typeof PAID_METRICS)[number];

export const ORGANIC_METRIC_LABELS: Record<OrganicMetricKey, string> = {
  reach: "Alcance",
  impressions: "Impressões",
  likes: "Curtidas",
  comments: "Comentários",
  saves: "Salvamentos",
  shares: "Compartilhamentos",
  plays: "Reproduções",
};

export const PAID_METRIC_LABELS: Record<PaidMetricKey, string> = {
  ad_spend: "Investimento",
  ad_impressions: "Impressões pagas",
  ad_reach: "Alcance pago",
};

export function truncateCaption(caption: string | null, max = 60): string {
  if (!caption?.trim()) return "Publicação Instagram";
  const line = caption.trim().split("\n")[0] ?? "";
  return line.length > max ? `${line.slice(0, max)}…` : line;
}

export function hasBoostedHistory(history: InstagramMediaInsightRow[]): boolean {
  return history.some((r) => r.is_boosted === true);
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

/** Last snapshot per bucket for cumulative daily metrics. */
export function filterInsightHistory(
  history: InstagramMediaInsightRow[],
  period: InsightPeriod,
): InstagramMediaInsightRow[] {
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

  const buckets = new Map<string, InstagramMediaInsightRow>();
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
  history: InstagramMediaInsightRow[],
  key: OrganicMetricKey | PaidMetricKey,
): number {
  if (history.length === 0) return 0;
  const last = history[history.length - 1]!;
  return Number(last[key] ?? 0);
}

export function chartDataForMetric(
  history: InstagramMediaInsightRow[],
  key: OrganicMetricKey | PaidMetricKey,
) {
  return history.map((row) => ({
    date: row.data_referencia,
    label: new Date(`${row.data_referencia}T12:00:00`).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    }),
    value: Number(row[key] ?? 0),
  }));
}
