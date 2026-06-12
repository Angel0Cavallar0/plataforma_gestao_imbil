import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoiCharts } from "@/components/marketing/events/roi/RoiCharts";
import { getEventsRoi } from "@/server/queries/marketing/events";
import type { EventRoiRow } from "@/types/marketing-events";

function brl(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pct(value: number | null): string {
  return value === null || value === undefined ? "—" : `${value}%`;
}

function cpl(row: EventRoiRow): number | null {
  if (!row.investment || !row.leads_total) return null;
  return row.investment / row.leads_total;
}

function cplQualified(row: EventRoiRow): number | null {
  if (!row.investment || !row.leads_qualified) return null;
  return row.investment / row.leads_qualified;
}

export default async function RoiEventoPage() {
  const rows = await getEventsRoi();

  const totalInvestment = rows.reduce((s, r) => s + (r.investment ?? 0), 0);
  const totalLeads = rows.reduce((s, r) => s + r.leads_total, 0);
  const totalQualified = rows.reduce((s, r) => s + r.leads_qualified, 0);
  const avgCpl = totalLeads ? totalInvestment / totalLeads : null;

  const withRoi = rows.filter(
    (r) => r.estimated_value_per_lead !== null && r.investment && r.investment > 0,
  );
  const consolidatedRoi = withRoi.length
    ? ((withRoi.reduce(
        (s, r) => s + r.leads_qualified * (r.estimated_value_per_lead ?? 0),
        0,
      ) -
        withRoi.reduce((s, r) => s + (r.investment ?? 0), 0)) /
        withRoi.reduce((s, r) => s + (r.investment ?? 0), 0)) *
      100
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">ROI Evento</h1>
        <p className="text-sm text-muted-foreground">
          Performance dos eventos com status <strong>realizado</strong>. ROI estimado =
          leads qualificados × valor estimado por lead (até o Módulo Comercial trazer
          receita real).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Investimento total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{brl(totalInvestment)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads gerados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalLeads}</p>
            <p className="text-xs text-muted-foreground">{totalQualified} qualificados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CPL médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{brl(avgCpl)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle
              className="text-sm font-medium text-muted-foreground"
              title="Base: leads qualificados × valor estimado por lead, por evento"
            >
              ROI estimado consolidado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {consolidatedRoi === null ? "—" : `${consolidatedRoi.toFixed(1)}%`}
            </p>
          </CardContent>
        </Card>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum evento realizado ainda — o ROI aparece aqui quando um evento chega ao
          status “Realizado” no Kanban.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Evento</th>
                  <th className="px-3 py-2 text-right">Investimento</th>
                  <th className="px-3 py-2 text-right">Leads</th>
                  <th className="px-3 py-2 text-right">Qualificados</th>
                  <th className="px-3 py-2 text-right">CPL</th>
                  <th className="px-3 py-2 text-right">CPL qualif.</th>
                  <th className="px-3 py-2 text-right">Tx. qualif.</th>
                  <th className="px-3 py-2 text-right">% consent.</th>
                  <th className="px-3 py-2 text-right">Encaminhados</th>
                  <th
                    className="px-3 py-2 text-right"
                    title="leads qualificados × valor estimado por lead − investimento, sobre o investimento"
                  >
                    ROI estimado
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-3 py-2">
                      <Link
                        href={`/modulos/marketing/eventos/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.name}
                        {row.edition && (
                          <span className="text-muted-foreground"> · {row.edition}</span>
                        )}
                      </Link>
                      <span className="block text-xs text-muted-foreground">
                        {[row.city, row.state].filter(Boolean).join("/")}
                        {row.starts_on &&
                          ` · ${new Date(row.starts_on + "T00:00:00").toLocaleDateString("pt-BR")}`}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">{brl(row.investment)}</td>
                    <td className="px-3 py-2 text-right">{row.leads_total}</td>
                    <td className="px-3 py-2 text-right">{row.leads_qualified}</td>
                    <td className="px-3 py-2 text-right">{brl(cpl(row))}</td>
                    <td className="px-3 py-2 text-right">{brl(cplQualified(row))}</td>
                    <td className="px-3 py-2 text-right">
                      {row.leads_total
                        ? pct(Math.round((row.leads_qualified / row.leads_total) * 100))
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {row.leads_total
                        ? pct(
                            Math.round((row.leads_with_consent / row.leads_total) * 100),
                          )
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">{row.leads_forwarded}</td>
                    <td className="px-3 py-2 text-right">
                      {row.roi_estimated_pct !== null ? (
                        `${row.roi_estimated_pct}%`
                      ) : (
                        <Link
                          href={`/modulos/marketing/eventos/${row.id}?tab=editar`}
                          className="text-xs text-muted-foreground hover:underline"
                          title="Configure o valor estimado por lead para calcular o ROI"
                        >
                          — configurar
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <RoiCharts rows={rows} />
        </>
      )}
    </div>
  );
}
