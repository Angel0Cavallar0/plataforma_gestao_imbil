import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OpenAdsManagerButton } from "@/components/marketing/ad-spend/shared/OpenAdsManagerButton";
import { AD_PLATFORMS, AD_PLATFORM_BY_ROUTE } from "@/lib/constants/marketing-ads";
import { getCampaignHistory } from "@/server/queries/marketing/ad-spend";
import {
  buildCampaignHistory,
  formatRefDate,
  type HistoryColumn,
} from "@/lib/marketing/campaign-history";
import type { AdPlatformSlug } from "@/types/marketing-ads";

type Row = Record<string, unknown>;

function HistoryTable({
  columns,
  rows,
  firstLabel,
  firstCell,
}: {
  columns: HistoryColumn[];
  rows: Row[];
  firstLabel: string;
  firstCell: (row: Row) => string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2">{firstLabel}</th>
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2 text-right">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t">
              <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                {firstCell(row)}
              </td>
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2 text-right tabular-nums">
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t bg-muted/30 font-medium">
          <tr>
            <td className="px-3 py-2">Total</td>
            {columns.map((c) => (
              <td key={c.key} className="px-3 py-2 text-right tabular-nums">
                {c.total(rows)}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default async function CampanhaDetalhePage({
  params,
}: {
  params: Promise<{ platform: string; id: string }>;
}) {
  const { platform, id } = await params;
  const slug = AD_PLATFORM_BY_ROUTE[platform] as AdPlatformSlug | undefined;
  if (!slug) notFound();

  const campaignId = decodeURIComponent(id);
  const rows = await getCampaignHistory(slug, campaignId);
  const meta = AD_PLATFORMS[slug];
  const platformPath = `/modulos/marketing/midia-paga/${meta.routeSlug}`;

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <Link
          href={platformPath}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para {meta.name}
        </Link>
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum histórico encontrado para esta campanha.
        </p>
      </div>
    );
  }

  const history = buildCampaignHistory(slug, rows);
  const investColumn = history.columns.find((c) => c.label === "Investimento");

  const dates = rows
    .map((r) => String(r.data_referencia))
    .sort((a, b) => (a < b ? -1 : 1));
  const periodLabel = `${formatRefDate(dates[0])} — ${formatRefDate(dates[dates.length - 1])}`;

  return (
    <div className="space-y-6">
      <Link
        href={platformPath}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para {meta.name}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <span
              className="inline-block h-4 w-4 rounded-full"
              style={{ backgroundColor: meta.color }}
            />
            {history.campaignName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {meta.name} · {periodLabel} · {history.groups.length}{" "}
            {history.groupLabel.toLowerCase()}
            {history.groups.length > 1 ? "s" : ""}
          </p>
        </div>
        <OpenAdsManagerButton
          platformSlug={slug}
          level="campaign"
          ids={{ campaignId }}
          variant="outline"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Total da campanha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Consolidado</th>
                  {history.columns.map((c) => (
                    <th key={c.key} className="px-3 py-2 text-right">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t font-medium">
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    Todas as datas
                  </td>
                  {history.columns.map((c) => (
                    <td key={c.key} className="px-3 py-2 text-right tabular-nums">
                      {c.total(history.allRows)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">
          Histórico por {history.groupLabel.toLowerCase()}
        </h2>
        <p className="text-sm text-muted-foreground">
          Cada {history.groupLabel.toLowerCase()} agrupa seu histórico diário. Clique para
          expandir.
        </p>

        {history.groups.map((group, i) => (
          <details
            key={group.id}
            open={i === 0}
            className="group rounded-lg border bg-card"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{group.name}</p>
                {group.subtitle && (
                  <p className="truncate text-xs text-muted-foreground">
                    {group.subtitle}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                {investColumn && (
                  <p className="font-medium tabular-nums">
                    {investColumn.total(group.rows)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {group.rows.length} {group.rows.length > 1 ? "dias" : "dia"}
                </p>
              </div>
            </summary>
            <div className="border-t p-3">
              <HistoryTable
                columns={history.columns}
                rows={group.rows}
                firstLabel="Dia"
                firstCell={(row) => formatRefDate(row.data_referencia)}
              />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
