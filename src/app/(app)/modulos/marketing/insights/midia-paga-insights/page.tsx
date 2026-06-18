import { GenerateReportButton } from "@/components/marketing/insights/GenerateReportButton";
import { ReportPanel } from "@/components/marketing/insights/ReportPanel";
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

export default async function MidiaPagaInsightsReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const reportId = first(sp.report);
  const tipo = first(sp.tipo) as ReportTipo | undefined;

  const [reports, remaining, webhookUrl] = await Promise.all([
    listReports(tipo),
    getRemainingReportQuota(),
    getReportsWebhookUrl(),
  ]);

  const targetId = reportId ?? reports[0]?.id;
  const report = targetId ? await getReportById(targetId) : null;
  const enrichment = await enrichReportEntities(report?.report_json ?? null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Insights — Mídia Paga Insights</h1>
          <p className="text-sm text-muted-foreground">
            Análise de mídia paga gerada por IA: melhor campanha, gasto e recomendações.
          </p>
        </div>
        <GenerateReportButton
          scope="midia_paga_insights"
          remaining={remaining}
          webhookConfigured={webhookUrl.trim().length > 0}
        />
      </div>

      <ReportPanel
        title="Relatório de Mídia Paga (IA)"
        scope="midia_paga_insights"
        report={report}
        enrichment={enrichment}
        reports={reports}
      />
    </div>
  );
}
