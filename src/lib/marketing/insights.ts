import { startOfWeek, startOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toIsoDate, fromIsoDate } from "@/lib/marketing/ad-spend";
import { NETWORK_SLUGS } from "@/lib/constants/marketing-insights";
import type {
  FollowersHistoryRow,
  Granularity,
  InsightsFilters,
  SocialNetwork,
} from "@/types/marketing-insights";

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Período padrão dos Insights: últimos 30 dias (inclui a janela coletada). */
export function defaultInsightsRange(): InsightsFilters {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  return { date_from: toIsoDate(from), date_to: toIsoDate(to) };
}

/** Lê e normaliza o período a partir dos searchParams da rota. */
export function parseInsightsFilters(params: RawSearchParams): InsightsFilters {
  const def = defaultInsightsRange();
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;

  const fromRaw = firstParam(params.date_from);
  const toRaw = firstParam(params.date_to);
  const date_from = fromRaw && dateRe.test(fromRaw) ? fromRaw : def.date_from;
  let date_to = toRaw && dateRe.test(toRaw) ? toRaw : def.date_to;
  if (date_to < date_from) date_to = date_from;

  return { date_from, date_to };
}

// ---------------------------------------------------------------------------
// Formatação
// ---------------------------------------------------------------------------

/** Inteiro compacto para eixos de gráfico (ex.: 86.254 → "86,3 mil"). */
export function compactInt(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000)
    return `${(value / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (abs >= 1_000)
    return `${(value / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return value.toLocaleString("pt-BR");
}

/** Delta percentual com sinal (ex.: +12,3% / −4,5% / "—"). */
export function formatDeltaPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

/** Delta absoluto com sinal (ex.: +30 / −5). */
export function formatDeltaInt(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(Math.round(value)).toLocaleString("pt-BR")}`;
}

/** Duração em segundos → "2m 25s" / "45s". */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return m > 0 ? `${m}m ${rest}s` : `${rest}s`;
}

/** Data ISO (yyyy-mm-dd) → "dd/MM". */
export function fmtShortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function truncate(text: string | null | undefined, max: number): string {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

// ---------------------------------------------------------------------------
// Histórico de seguidores (total em linha + ganho por período em barras)
// ---------------------------------------------------------------------------

export type FollowersChartPoint = {
  bucket: string; // chave ISO do início do balde
  label: string; // rótulo de exibição
  instagram_total: number | null;
  facebook_total: number | null;
  linkedin_total: number | null;
  instagram_gain: number;
  facebook_gain: number;
  linkedin_gain: number;
};

function bucketKey(iso: string, gran: Granularity): { key: string; label: string } {
  if (gran === "day") {
    return { key: iso, label: fmtShortDate(iso) };
  }
  const d = fromIsoDate(iso);
  if (gran === "week") {
    const start = startOfWeek(d, { weekStartsOn: 1 });
    return {
      key: toIsoDate(start),
      label: `Sem. ${format(start, "dd/MM", { locale: ptBR })}`,
    };
  }
  const start = startOfMonth(d);
  return { key: toIsoDate(start), label: format(start, "MMM/yy", { locale: ptBR }) };
}

/**
 * Agrega as linhas da v_followers_history por granularidade.
 * Total = último valor cumulativo do balde por rede; Ganho = soma do período.
 * Função pura → usada no client (toggle de granularidade sem refetch).
 */
export function buildFollowersChart(
  rows: FollowersHistoryRow[],
  gran: Granularity,
): FollowersChartPoint[] {
  const buckets = new Map<
    string,
    {
      label: string;
      // por rede: último total (com a data) e soma de ganhos
      totals: Record<SocialNetwork, { date: string; value: number } | null>;
      gains: Record<SocialNetwork, number>;
    }
  >();

  for (const row of rows) {
    if (!NETWORK_SLUGS.includes(row.network)) continue;
    const { key, label } = bucketKey(row.data_referencia, gran);
    const b = buckets.get(key) ?? {
      label,
      totals: { instagram: null, facebook: null, linkedin: null },
      gains: { instagram: 0, facebook: 0, linkedin: 0 },
    };

    if (row.total_followers != null) {
      const cur = b.totals[row.network];
      if (!cur || row.data_referencia >= cur.date) {
        b.totals[row.network] = { date: row.data_referencia, value: row.total_followers };
      }
    }
    if (row.followers_gained != null) {
      b.gains[row.network] += row.followers_gained;
    }
    buckets.set(key, b);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, b]) => ({
      bucket: key,
      label: b.label,
      instagram_total: b.totals.instagram?.value ?? null,
      facebook_total: b.totals.facebook?.value ?? null,
      linkedin_total: b.totals.linkedin?.value ?? null,
      instagram_gain: b.gains.instagram,
      facebook_gain: b.gains.facebook,
      linkedin_gain: b.gains.linkedin,
    }));
}
