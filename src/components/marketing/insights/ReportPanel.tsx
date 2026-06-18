import { ReportSelector } from "@/components/marketing/insights/ReportSelector";
import { ReportViewer } from "@/components/marketing/insights/ReportViewer";
import { ReportMarkdownDialog } from "@/components/marketing/insights/ReportMarkdownDialog";
import { ReportRealtimeListener } from "@/components/marketing/insights/ReportRealtimeListener";
import type {
  MarketingReport,
  ReportEnrichment,
  ReportListItem,
  ReportScope,
} from "@/types/marketing-insights";

/**
 * Bloco de relatório de IA: seletor + render por escopo + "ver completo" +
 * atualização automática via Realtime. Usado nas abas Redes Sociais
 * (organico) e Mídia Paga Insights (pago).
 */
export function ReportPanel({
  title,
  scope,
  report,
  enrichment,
  reports,
}: {
  title: string;
  scope: ReportScope;
  report: MarketingReport | null;
  enrichment: ReportEnrichment;
  reports: ReportListItem[];
}) {
  return (
    <section className="space-y-4">
      <ReportRealtimeListener />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex flex-wrap items-end gap-3">
          <ReportSelector
            reports={reports}
            selectedId={report?.id ?? null}
            model={report?.model ?? null}
          />
          {report?.report_markdown && (
            <ReportMarkdownDialog markdown={report.report_markdown} />
          )}
        </div>
      </div>

      {report ? (
        <ReportViewer report={report} enrichment={enrichment} scope={scope} />
      ) : (
        <p className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
          Nenhum relatório gerado ainda. Use “Gerar Relatório” para solicitar um.
        </p>
      )}
    </section>
  );
}
