import { AdSpendFilters } from "@/components/marketing/ad-spend/AdSpendFilters";
import { ReportSelector } from "@/components/marketing/insights/ReportSelector";
import { GenerateReportButton } from "@/components/marketing/insights/GenerateReportButton";
import { PaidDataPanels } from "@/components/marketing/insights/paid/PaidDataPanels";
import { ReportPanel } from "@/components/marketing/insights/ReportPanel";
import { defaultDateRange, parseAdSpendFilters } from "@/lib/marketing/ad-spend";
import { getReportById, listReports } from "@/server/queries/marketing/insights";
import { enrichReportEntities } from "@/server/queries/marketing/report-enrichment";
import {
  getRemainingReportQuota,
  getReportsWebhookUrl,
} from "@/server/queries/marketing/reports-control";
import type { ReportTipo } from "@/types/marketing-insights";

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function MidiaPagaInsightsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const reportId = first(sp.report);
  const tipo = first(sp.tipo) as ReportTipo | undefined;

  // O relatório (mais recente por padrão) define o período padrão do filtro.
  const reports = await listReports(tipo);
  // Usa o relatório da URL apenas se ainda existir na lista; senão, o mais recente.
  const targetId =
    reportId && reports.some((r) => r.id === reportId) ? reportId : reports[0]?.id;
  const report = targetId ? await getReportById(targetId) : null;

  const reportRange =
    report?.periodo_inicio && report?.periodo_fim
      ? { date_from: report.periodo_inicio, date_to: report.periodo_fim }
      : undefined;
  const defaultRange = reportRange ?? defaultDateRange();
  const filters = parseAdSpendFilters(sp, defaultRange);

  const [remaining, webhookUrl] = await Promise.all([
    getRemainingReportQuota(),
    getReportsWebhookUrl(),
  ]);

  const enrichment = await enrichReportEntities(report?.report_json ?? null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Insights — Mídia Paga</h1>
          <p className="text-sm text-muted-foreground">
            Dados detalhados das campanhas de Meta Ads, Google Ads e LinkedIn Ads, com a
            análise de IA do período.
          </p>
        </div>
        <GenerateReportButton
          scope="midia_paga"
          remaining={remaining}
          webhookConfigured={webhookUrl.trim().length > 0}
        />
      </div>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <AdSpendFilters filters={filters} defaultRange={defaultRange} />
        <ReportSelector
          reports={reports}
          selectedId={report?.id ?? null}
          model={report?.model ?? null}
          markdown={report?.report_markdown ?? null}
        />
      </div>

      <PaidDataPanels filters={filters} />

      <ReportPanel
        title="Relatório de Mídia Paga (IA)"
        scope="midia_paga_insights"
        report={report}
        enrichment={enrichment}
      />
    </div>
  );
}
