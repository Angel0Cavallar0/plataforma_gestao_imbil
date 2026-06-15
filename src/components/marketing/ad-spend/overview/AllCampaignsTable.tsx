"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { brl, int, pct } from "@/lib/marketing/ad-spend";
import { AD_PLATFORMS } from "@/lib/constants/marketing-ads";
import { RoasCell } from "@/components/marketing/ad-spend/shared/RoasCell";
import { ConversionHeaderInfo } from "@/components/marketing/ad-spend/shared/ConversionHeaderInfo";
import { OpenAdsManagerButton } from "@/components/marketing/ad-spend/shared/OpenAdsManagerButton";
import type { CampaignRow } from "@/types/marketing-ads";

type SortKey = keyof Pick<
  CampaignRow,
  | "impressions"
  | "clicks"
  | "spend"
  | "conversions"
  | "ctr_pct"
  | "cpc"
  | "cpm"
  | "cost_per_conversion"
  | "conversion_rate_pct"
  | "roas"
>;

const COLUMNS: { key: SortKey; label: string; info?: boolean }[] = [
  { key: "impressions", label: "Impressões" },
  { key: "clicks", label: "Cliques" },
  { key: "spend", label: "Investimento" },
  { key: "conversions", label: "Conversões", info: true },
  { key: "ctr_pct", label: "CTR" },
  { key: "cpc", label: "CPC" },
  { key: "cpm", label: "CPM" },
  { key: "cost_per_conversion", label: "Custo/conv." },
  { key: "conversion_rate_pct", label: "Tx. conv." },
  { key: "roas", label: "ROAS" },
];

function renderValue(row: CampaignRow, key: SortKey) {
  switch (key) {
    case "impressions":
    case "clicks":
    case "conversions":
      return int(row[key]);
    case "spend":
    case "cpc":
    case "cpm":
    case "cost_per_conversion":
      return brl(row[key]);
    case "ctr_pct":
    case "conversion_rate_pct":
      return pct(row[key]);
    case "roas":
      return <RoasCell platformSlug={row.platform_slug} roas={row.roas} />;
  }
}

/** Tabela unificada de campanhas, ordenável, com deep link por linha (Seção 9.3). */
export function AllCampaignsTable({ campaigns }: { campaigns: CampaignRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const copy = [...campaigns];
    copy.sort((a, b) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      return dir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return copy;
  }, [campaigns, sortKey, dir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setDir("desc");
    }
  }

  if (campaigns.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhuma campanha com dados no período selecionado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Campanha</th>
            {COLUMNS.map((col) => (
              <th key={col.key} className="px-3 py-2 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort(col.key)}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  {col.label}
                  {col.info && <ConversionHeaderInfo />}
                  {sortKey === col.key &&
                    (dir === "asc" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    ))}
                </button>
              </th>
            ))}
            <th className="px-3 py-2 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={`${row.platform_slug}:${row.external_campaign_id}`}
              className="border-t"
            >
              <td className="px-3 py-2">
                <span className="flex items-center gap-2 font-medium">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: AD_PLATFORMS[row.platform_slug].color }}
                  />
                  {row.campaign_name ?? row.external_campaign_id}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {AD_PLATFORMS[row.platform_slug].name}
                </span>
              </td>
              {COLUMNS.map((col) => (
                <td key={col.key} className={cn("px-3 py-2 text-right tabular-nums")}>
                  {renderValue(row, col.key)}
                </td>
              ))}
              <td className="px-3 py-2 text-right">
                <OpenAdsManagerButton
                  platformSlug={row.platform_slug}
                  level="campaign"
                  ids={{ campaignId: row.external_campaign_id }}
                  label="Gerenciador"
                  variant="ghost"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
