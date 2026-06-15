import { brl, int, pct } from "@/lib/marketing/ad-spend";
import type { AdPlatformSlug } from "@/types/marketing-ads";

type Row = Record<string, unknown>;

function num(r: Row, key: string): number {
  const v = r[key];
  return v == null || Number.isNaN(Number(v)) ? 0 : Number(v);
}
function sum(rows: Row[], key: string): number {
  return rows.reduce((acc, r) => acc + num(r, key), 0);
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function ctrPct(impr: number, clicks: number): number | null {
  return impr > 0 ? round2((clicks / impr) * 100) : null;
}
function cpcCalc(spend: number, clicks: number): number | null {
  return clicks > 0 ? round2(spend / clicks) : null;
}
function cpmCalc(spend: number, impr: number): number | null {
  return impr > 0 ? round2((spend / impr) * 1000) : null;
}
/** Média ponderada por impressões (para frações como impression share). */
function wAvgByImpressions(rows: Row[], key: string): number | null {
  let n = 0;
  let d = 0;
  for (const r of rows) {
    if (r[key] == null) continue;
    const w = num(r, "impressions");
    n += Number(r[key]) * w;
    d += w;
  }
  return d > 0 ? round2((n / d) * 100) : null;
}

/** Coluna da tabela de histórico: calcula a célula diária e o total de um grupo. */
export type HistoryColumn = {
  key: string;
  label: string;
  /** valor formatado de uma linha diária. */
  cell: (row: Row) => string;
  /** valor formatado agregando várias linhas (subtotal/total). */
  total: (rows: Row[]) => string;
};

export type CampaignGroup = {
  id: string;
  name: string;
  subtitle: string | null;
  /** linhas diárias, ordenadas da mais recente para a mais antiga. */
  rows: Row[];
};

export type CampaignHistory = {
  campaignName: string;
  /** chave do campo que identifica cada grupo (anúncio/criativo). */
  groupLabel: string;
  columns: HistoryColumn[];
  groups: CampaignGroup[];
  /** todas as linhas (para o total geral da campanha). */
  allRows: Row[];
};

const metaColumns = (): HistoryColumn[] => [
  {
    key: "impressions",
    label: "Impressões",
    cell: (r) => int(num(r, "impressions")),
    total: (rs) => int(sum(rs, "impressions")),
  },
  {
    key: "reach",
    label: "Alcance",
    cell: (r) => int(num(r, "reach")),
    total: (rs) => int(sum(rs, "reach")),
  },
  {
    key: "frequency",
    label: "Frequência",
    cell: (r) => {
      const reach = num(r, "reach");
      return reach > 0 ? round2(num(r, "impressions") / reach).toString() : "—";
    },
    total: (rs) => {
      const reach = sum(rs, "reach");
      return reach > 0 ? round2(sum(rs, "impressions") / reach).toString() : "—";
    },
  },
  {
    key: "clicks",
    label: "Cliques",
    cell: (r) => int(num(r, "clicks")),
    total: (rs) => int(sum(rs, "clicks")),
  },
  {
    key: "ctr",
    label: "CTR",
    cell: (r) => pct(ctrPct(num(r, "impressions"), num(r, "clicks"))),
    total: (rs) => pct(ctrPct(sum(rs, "impressions"), sum(rs, "clicks"))),
  },
  {
    key: "cpc",
    label: "CPC",
    cell: (r) => brl(cpcCalc(num(r, "spend"), num(r, "clicks"))),
    total: (rs) => brl(cpcCalc(sum(rs, "spend"), sum(rs, "clicks"))),
  },
  {
    key: "cpm",
    label: "CPM",
    cell: (r) => brl(cpmCalc(num(r, "spend"), num(r, "impressions"))),
    total: (rs) => brl(cpmCalc(sum(rs, "spend"), sum(rs, "impressions"))),
  },
  {
    key: "spend",
    label: "Investimento",
    cell: (r) => brl(num(r, "spend")),
    total: (rs) => brl(sum(rs, "spend")),
  },
  {
    key: "leads",
    label: "Leads",
    cell: (r) => int(num(r, "leads") || num(r, "pixel_lead")),
    total: (rs) => int(sum(rs, "leads") || sum(rs, "pixel_lead")),
  },
  {
    key: "landing_page_views",
    label: "LPV",
    cell: (r) => int(num(r, "landing_page_views")),
    total: (rs) => int(sum(rs, "landing_page_views")),
  },
  {
    key: "post_engagement",
    label: "Engajamento",
    cell: (r) => int(num(r, "post_engagement")),
    total: (rs) => int(sum(rs, "post_engagement")),
  },
];

const googleColumns = (): HistoryColumn[] => [
  {
    key: "impressions",
    label: "Impressões",
    cell: (r) => int(num(r, "impressions")),
    total: (rs) => int(sum(rs, "impressions")),
  },
  {
    key: "clicks",
    label: "Cliques",
    cell: (r) => int(num(r, "clicks")),
    total: (rs) => int(sum(rs, "clicks")),
  },
  {
    key: "ctr",
    label: "CTR",
    cell: (r) => pct(ctrPct(num(r, "impressions"), num(r, "clicks"))),
    total: (rs) => pct(ctrPct(sum(rs, "impressions"), sum(rs, "clicks"))),
  },
  {
    key: "cpc",
    label: "CPC",
    cell: (r) => brl(cpcCalc(num(r, "cost"), num(r, "clicks"))),
    total: (rs) => brl(cpcCalc(sum(rs, "cost"), sum(rs, "clicks"))),
  },
  {
    key: "cpm",
    label: "CPM",
    cell: (r) => brl(cpmCalc(num(r, "cost"), num(r, "impressions"))),
    total: (rs) => brl(cpmCalc(sum(rs, "cost"), sum(rs, "impressions"))),
  },
  {
    key: "cost",
    label: "Investimento",
    cell: (r) => brl(num(r, "cost")),
    total: (rs) => brl(sum(rs, "cost")),
  },
  {
    key: "conversions",
    label: "Conversões",
    cell: (r) => int(num(r, "conversions")),
    total: (rs) => int(sum(rs, "conversions")),
  },
  {
    key: "conversions_value",
    label: "Valor conv.",
    cell: (r) => brl(num(r, "conversions_value")),
    total: (rs) => brl(sum(rs, "conversions_value")),
  },
  {
    key: "search_impression_share",
    label: "Impr. Share",
    cell: (r) =>
      r.search_impression_share == null
        ? "—"
        : pct(round2(Number(r.search_impression_share) * 100)),
    total: (rs) => pct(wAvgByImpressions(rs, "search_impression_share")),
  },
];

const linkedinColumns = (): HistoryColumn[] => [
  {
    key: "impressions",
    label: "Impressões",
    cell: (r) => int(num(r, "impressions")),
    total: (rs) => int(sum(rs, "impressions")),
  },
  {
    key: "reach",
    label: "Alcance",
    cell: (r) => int(num(r, "reach")),
    total: (rs) => int(sum(rs, "reach")),
  },
  {
    key: "clicks",
    label: "Cliques",
    cell: (r) => int(num(r, "clicks")),
    total: (rs) => int(sum(rs, "clicks")),
  },
  {
    key: "ctr",
    label: "CTR",
    cell: (r) => pct(ctrPct(num(r, "impressions"), num(r, "clicks"))),
    total: (rs) => pct(ctrPct(sum(rs, "impressions"), sum(rs, "clicks"))),
  },
  {
    key: "cpc",
    label: "CPC",
    cell: (r) => brl(cpcCalc(num(r, "spend"), num(r, "clicks"))),
    total: (rs) => brl(cpcCalc(sum(rs, "spend"), sum(rs, "clicks"))),
  },
  {
    key: "cpm",
    label: "CPM",
    cell: (r) => brl(cpmCalc(num(r, "spend"), num(r, "impressions"))),
    total: (rs) => brl(cpmCalc(sum(rs, "spend"), sum(rs, "impressions"))),
  },
  {
    key: "spend",
    label: "Investimento",
    cell: (r) => brl(num(r, "spend")),
    total: (rs) => brl(sum(rs, "spend")),
  },
  {
    key: "likes",
    label: "Curtidas",
    cell: (r) => int(num(r, "likes")),
    total: (rs) => int(sum(rs, "likes")),
  },
  {
    key: "comments",
    label: "Comentários",
    cell: (r) => int(num(r, "comments")),
    total: (rs) => int(sum(rs, "comments")),
  },
  {
    key: "shares",
    label: "Compart.",
    cell: (r) => int(num(r, "shares")),
    total: (rs) => int(sum(rs, "shares")),
  },
  {
    key: "follows",
    label: "Seguidores",
    cell: (r) => int(num(r, "follows")),
    total: (rs) => int(sum(rs, "follows")),
  },
  {
    key: "lead_gen_form_opens",
    label: "Form. abertos",
    cell: (r) => int(num(r, "lead_gen_form_opens")),
    total: (rs) => int(sum(rs, "lead_gen_form_opens")),
  },
  {
    key: "lead_gen_submissions",
    label: "Envios",
    cell: (r) => int(num(r, "lead_gen_submissions")),
    total: (rs) => int(sum(rs, "lead_gen_submissions")),
  },
];

const CONFIG: Record<
  AdPlatformSlug,
  {
    columns: () => HistoryColumn[];
    idKey: string;
    nameKey: string;
    subKey: string;
    groupLabel: string;
  }
> = {
  meta_ads: {
    columns: metaColumns,
    idKey: "ad_id",
    nameKey: "ad_name",
    subKey: "adset_name",
    groupLabel: "Anúncio",
  },
  google_ads: {
    columns: googleColumns,
    idKey: "ad_id",
    nameKey: "ad_name",
    subKey: "adgroup_name",
    groupLabel: "Anúncio",
  },
  linkedin_ads: {
    columns: linkedinColumns,
    idKey: "creative_id",
    nameKey: "creative_name",
    subKey: "campaign_group_name",
    groupLabel: "Criativo",
  },
};

/**
 * Agrupa as linhas de histórico de uma campanha por anúncio/criativo,
 * ordenando cada grupo por data (mais recente primeiro) e os grupos por
 * investimento decrescente.
 */
export function buildCampaignHistory(slug: AdPlatformSlug, rows: Row[]): CampaignHistory {
  const cfg = CONFIG[slug];
  const spendKey = slug === "google_ads" ? "cost" : "spend";

  const groupsMap = new Map<string, CampaignGroup>();
  for (const r of rows) {
    const id = String(r[cfg.idKey] ?? "—");
    const group =
      groupsMap.get(id) ??
      ({
        id,
        name: (r[cfg.nameKey] as string) || id,
        subtitle: (r[cfg.subKey] as string) || null,
        rows: [],
      } satisfies CampaignGroup);
    group.rows.push(r);
    groupsMap.set(id, group);
  }

  const groups = [...groupsMap.values()]
    .map((g) => ({
      ...g,
      rows: [...g.rows].sort((a, b) =>
        String(b.data_referencia) < String(a.data_referencia) ? -1 : 1,
      ),
    }))
    .sort((a, b) => sum(b.rows, spendKey) - sum(a.rows, spendKey));

  const campaignName =
    (rows.find((r) => r.campaign_name)?.campaign_name as string) || "Campanha";

  return {
    campaignName,
    groupLabel: cfg.groupLabel,
    columns: cfg.columns(),
    groups,
    allRows: rows,
  };
}

export function formatRefDate(value: unknown): string {
  if (!value) return "—";
  return new Date(String(value) + "T00:00:00").toLocaleDateString("pt-BR");
}
