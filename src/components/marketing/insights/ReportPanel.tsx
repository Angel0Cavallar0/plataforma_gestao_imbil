import { ReportViewer } from "@/components/marketing/insights/ReportViewer";
import { ReportRealtimeListener } from "@/components/marketing/insights/ReportRealtimeListener";
import type {
  MarketingReport,
  ReportEnrichment,
  ReportScope,
} from "@/types/marketing-insights";

/**
 * Bloco de conteúdo do relatório de IA (render por escopo) + atualização
 * automática via Realtime. O seletor de relatório fica na barra de filtros,
 * junto ao filtro de período.
 */
export function ReportPanel({
  title,
  scope,
  report,
  enrichment,
}: {
  title: string;
  scope: ReportScope;
  report: MarketingReport | null;
  enrichment: ReportEnrichment;
}) {
  return (
    <section className="space-y-4">
      <ReportRealtimeListener />
      <h2 className="text-lg font-semibold">{title}</h2>

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
