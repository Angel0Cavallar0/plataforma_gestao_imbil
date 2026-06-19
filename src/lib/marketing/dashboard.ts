import { brl, fromIsoDate, int, toIsoDate } from "@/lib/marketing/ad-spend";
import type { DashboardPeriod, PeriodPreset } from "@/types/marketing-dashboard";

export {
  brl,
  int,
  pct,
  roasLabel,
  toIsoDate,
  fromIsoDate,
} from "@/lib/marketing/ad-spend";

export const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "this_month", label: "Este mês" },
  { value: "last_month", label: "Mês passado" },
  { value: "custom", label: "Personalizado" },
];

const DAY = 24 * 60 * 60 * 1000;

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY);
}

/** Resolve um preset em { from, to } (datas locais, sem shift de fuso). */
export function rangeFromPreset(preset: PeriodPreset): { from: string; to: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case "today":
      return { from: toIsoDate(today), to: toIsoDate(today) };
    case "7d":
      return { from: toIsoDate(addDays(today, -6)), to: toIsoDate(today) };
    case "this_month": {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: toIsoDate(first), to: toIsoDate(today) };
    }
    case "last_month": {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: toIsoDate(first), to: toIsoDate(last) };
    }
    case "30d":
    default:
      return { from: toIsoDate(addDays(today, -29)), to: toIsoDate(today) };
  }
}

/** Período anterior equivalente (mesma duração, imediatamente antes). */
export function previousPeriod(
  from: string,
  to: string,
): {
  prevFrom: string;
  prevTo: string;
} {
  const f = fromIsoDate(from);
  const t = fromIsoDate(to);
  const days = Math.round((t.getTime() - f.getTime()) / DAY) + 1;
  const prevTo = addDays(f, -1);
  const prevFrom = addDays(prevTo, -(days - 1));
  return { prevFrom: toIsoDate(prevFrom), prevTo: toIsoDate(prevTo) };
}

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const PRESET_VALUES = PERIOD_PRESETS.map((p) => p.value);

/** Lê o período do dashboard a partir dos searchParams da rota. */
export function parseDashboardPeriod(params: RawSearchParams): DashboardPeriod {
  const presetRaw = firstParam(params.preset);
  const preset: PeriodPreset =
    presetRaw && (PRESET_VALUES as string[]).includes(presetRaw)
      ? (presetRaw as PeriodPreset)
      : "30d";

  let from: string;
  let to: string;

  if (preset === "custom") {
    const fromRaw = firstParam(params.from);
    const toRaw = firstParam(params.to);
    const def = rangeFromPreset("30d");
    from = fromRaw && ISO_RE.test(fromRaw) ? fromRaw : def.from;
    to = toRaw && ISO_RE.test(toRaw) ? toRaw : def.to;
    if (to < from) to = from;
  } else {
    ({ from, to } = rangeFromPreset(preset));
  }

  const { prevFrom, prevTo } = previousPeriod(from, to);
  return { from, to, prevFrom, prevTo, preset };
}

/** Variação percentual entre atual e anterior (null quando não calculável). */
export function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

// --- Normalização da fonte dos alertas (Seção 8.5) ---

const SOURCE_LABELS: Record<string, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  linkedin_ads: "LinkedIn Ads",
  linkedin_page: "LinkedIn (página)",
  instagram: "Instagram",
  facebook: "Facebook",
};

/** Mapeia a `fonte` crua (mistura "Ads"/"Page") para um label limpo. */
export function normalizeSource(fonte: string | null | undefined): string {
  if (!fonte) return "Outros";
  const slug = fonte.trim().toLowerCase().replace(/\s+/g, "_");
  return SOURCE_LABELS[slug] ?? fonte.trim();
}

export const SEVERITY_LABELS: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

/** Cor (CSS var ou hex) por severidade — usada em badges e barras. */
export const SEVERITY_COLORS: Record<string, string> = {
  low: "var(--chart-2, #22c55e)",
  medium: "var(--chart-4, #eab308)",
  high: "var(--chart-5, #f97316)",
  critical: "var(--destructive, #dc2626)",
};

export const EVENT_STATUS_LABELS: Record<string, string> = {
  negociacao: "Negociação",
  confirmado: "Confirmado",
  em_preparacao: "Em preparação",
  realizado: "Realizado",
  cancelado: "Cancelado",
};

/** Ordem do pipeline de eventos (sem cancelado). */
export const EVENT_PIPELINE_ORDER = [
  "negociacao",
  "confirmado",
  "em_preparacao",
  "realizado",
] as const;

/** Paleta temática das plataformas/canais (cores via constantes existentes). */
export const CHANNEL_COLORS: Record<string, string> = {
  meta: "#1877F2",
  facebook: "#1877F2",
  instagram: "#E1306C",
  google: "#34A853",
  linkedin: "#0A66C2",
  eventos: "#9333ea",
  Eventos: "#9333ea",
  Meta: "#1877F2",
  Google: "#34A853",
  LinkedIn: "#0A66C2",
};

/** Cor de destaque da Imbil (vermelho da marca) usada nos benchmarks. */
export const IMBIL_COLOR = "#dc2626";

/** Paleta genérica para séries sem cor própria. */
export const CHART_PALETTE = [
  "var(--chart-1, #2563eb)",
  "var(--chart-2, #22c55e)",
  "var(--chart-3, #a855f7)",
  "var(--chart-4, #eab308)",
  "var(--chart-5, #f97316)",
  "#0ea5e9",
  "#ec4899",
  "#14b8a6",
];

export function channelColor(name: string, index = 0): string {
  return CHANNEL_COLORS[name] ?? CHART_PALETTE[index % CHART_PALETTE.length];
}

/** Formata data ISO curta (dd/MM) para eixos de gráfico. */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/** Formata data ISO completa (dd/MM/yyyy). */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Número compacto (1,2 mil / 3,4 mi). */
export function compact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Formato de valor serializável passado a gráficos client. Evita passar
 * funções de Server → Client Components (proibido em RSC).
 */
export type ValueFormat = "number" | "brl" | "int" | "compact";

/** Resolve um ValueFormat no formatador correspondente (uso no client). */
export function resolveFormat(format: ValueFormat): (v: number) => string {
  switch (format) {
    case "brl":
      return (v) => brl(v);
    case "int":
      return (v) => int(v);
    case "compact":
      return (v) => compact(v);
    case "number":
    default:
      return (v) => v.toLocaleString("pt-BR");
  }
}
