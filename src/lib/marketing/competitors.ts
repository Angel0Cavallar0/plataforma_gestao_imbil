import { IMBIL_NAME } from "@/types/marketing-competitors";

/** Paleta estável para diferenciar concorrentes nos gráficos (multi-série). */
const PALETTE = [
  "#2563eb", // azul
  "#16a34a", // verde
  "#ea580c", // laranja
  "#9333ea", // roxo
  "#0891b2", // ciano
  "#dc2626", // vermelho
  "#ca8a04", // âmbar
  "#db2777", // rosa
];

/** Cor de destaque da própria Imbil (benchmark) — vermelho padrão do site (--destructive). */
export const IMBIL_COLOR = "#dc2626";

/** Cor estável e determinística por nome de empresa. Imbil sempre destacada. */
export function competitorColor(name: string, index: number): string {
  if (name === IMBIL_NAME) return IMBIL_COLOR;
  return PALETTE[index % PALETTE.length];
}

export function isImbil(name: string): boolean {
  return name === IMBIL_NAME;
}

const numberFmt = new Intl.NumberFormat("pt-BR");

export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return numberFmt.format(Number(value));
}

/** Número compacto: 14200 → "14,2 mil". */
export function formatCompact(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value));
}

export function formatRating(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Eixo de gráficos: "17/06". */
export function formatShortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

/** Lê um único valor de searchParams (string), ignorando arrays. */
export function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
