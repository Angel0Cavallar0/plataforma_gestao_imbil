import { InsightsFilters } from "@/components/marketing/insights/InsightsFilters";
import { ReportSelector } from "@/components/marketing/insights/ReportSelector";
import { GenerateReportButton } from "@/components/marketing/insights/GenerateReportButton";
import { SocialNetworkTabs } from "@/components/marketing/insights/social/SocialNetworkTabs";
import { ReportPanel } from "@/components/marketing/insights/ReportPanel";
import { defaultInsightsRange, parseInsightsFilters } from "@/lib/marketing/insights";
import {
  getFollowersHistory,
  getInstagramExtra,
  getReportById,
  getSocialOverview,
  getSocialPosts,
  listReports,
} from "@/server/queries/marketing/insights";
import { enrichReportEntities } from "@/server/queries/marketing/report-enrichment";
import {
  getRemainingReportQuota,
  getReportsWebhookUrl,
} from "@/server/queries/marketing/reports-control";
import type { InsightsFilters as Filters, ReportTipo } from "@/types/marketing-insights";

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function RedesSociaisInsightsPage({
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

  const reportRange: Filters | undefined =
    report?.periodo_inicio && report?.periodo_fim
      ? { date_from: report.periodo_inicio, date_to: report.periodo_fim }
      : undefined;
  const defaultRange = reportRange ?? defaultInsightsRange();
  const filters = parseInsightsFilters(sp, defaultRange);

  const [overview, followersRows, posts, instagramExtra, remaining, webhookUrl] =
    await Promise.all([
      getSocialOverview(filters),
      getFollowersHistory(filters),
      getSocialPosts(filters),
      getInstagramExtra(filters),
      getRemainingReportQuota(),
      getReportsWebhookUrl(),
    ]);

  const enrichment = await enrichReportEntities(report?.report_json ?? null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Insights — Redes Sociais</h1>
          <p className="text-sm text-muted-foreground">
            Desempenho orgânico de Instagram, Facebook e LinkedIn.
          </p>
        </div>
        <GenerateReportButton
          scope="redes_sociais"
          remaining={remaining}
          webhookConfigured={webhookUrl.trim().length > 0}
        />
      </div>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <InsightsFilters filters={filters} defaultRange={defaultRange} />
        <ReportSelector
          reports={reports}
          selectedId={report?.id ?? null}
          model={report?.model ?? null}
          markdown={report?.report_markdown ?? null}
        />
      </div>

      <SocialNetworkTabs
        overview={overview}
        followersRows={followersRows}
        posts={posts}
        instagramExtra={instagramExtra}
      />

      <ReportPanel
        title="Relatório Orgânico (IA)"
        scope="redes_sociais"
        report={report}
        enrichment={enrichment}
      />
    </div>
  );
}
