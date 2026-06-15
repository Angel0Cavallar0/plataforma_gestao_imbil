import { AD_PLATFORM_SLUGS } from "@/lib/constants/marketing-ads";
import type { AdPlatformSlug, AdSpendFilters } from "@/types/marketing-ads";

/** Formata data Date → yyyy-mm-dd (sem timezone shift). */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Converte "yyyy-mm-dd" em Date local (sem deslocamento de fuso). */
export function fromIsoDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Período padrão: mês atual (do primeiro ao último dia). */
export function defaultDateRange(): { date_from: string; date_to: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { date_from: toIsoDate(first), date_to: toIsoDate(last) };
}

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Lê e normaliza os filtros a partir dos searchParams da rota. */
export function parseAdSpendFilters(params: RawSearchParams): AdSpendFilters {
  const def = defaultDateRange();
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;

  const fromRaw = firstParam(params.date_from);
  const toRaw = firstParam(params.date_to);
  const date_from = fromRaw && dateRe.test(fromRaw) ? fromRaw : def.date_from;
  let date_to = toRaw && dateRe.test(toRaw) ? toRaw : def.date_to;
  if (date_to < date_from) date_to = date_from;

  const platformsRaw = params.platforms;
  const platformsList = Array.isArray(platformsRaw)
    ? platformsRaw
    : platformsRaw
      ? platformsRaw.split(",")
      : [];
  const platforms = platformsList.filter((p): p is AdPlatformSlug =>
    (AD_PLATFORM_SLUGS as readonly string[]).includes(p),
  );

  const search = firstParam(params.search)?.trim() || undefined;

  return {
    date_from,
    date_to,
    platforms: platforms.length ? platforms : undefined,
    search: search?.slice(0, 120),
  };
}

/** Formata valor monetário em BRL. */
export function brl(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Formata número inteiro (pt-BR). */
export function int(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Math.round(value).toLocaleString("pt-BR");
}

/** Formata percentual com 2 casas. */
export function pct(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
}

/** Formata ROAS (multiplicador), ex.: 3.2x. */
export function roasLabel(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}x`;
}
