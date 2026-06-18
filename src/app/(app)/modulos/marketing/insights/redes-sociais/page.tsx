import { InsightsTabs } from "@/components/marketing/insights/InsightsTabs";
import { InsightsFilters } from "@/components/marketing/insights/InsightsFilters";
import { GenerateReportButton } from "@/components/marketing/insights/GenerateReportButton";
import { SocialNetworkTabs } from "@/components/marketing/insights/social/SocialNetworkTabs";
import { ReportPanel } from "@/components/marketing/insights/ReportPanel";
import { parseInsightsFilters } from "@/lib/marketing/insights";
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
import type { ReportTipo } from "@/types/marketing-insights";

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function RedesSociaisInsightsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseInsightsFilters(sp);
  const reportId = first(sp.report);
  const tipo = first(sp.tipo) as ReportTipo | undefined;

  const [overview, followersRows, posts, instagramExtra, reports, remaining, webhookUrl] =
    await Promise.all([
      getSocialOverview(filters),
      getFollowersHistory(filters),
      getSocialPosts(filters),
      getInstagramExtra(filters),
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

      <InsightsTabs />
      <InsightsFilters filters={filters} />

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
        reports={reports}
      />
    </div>
  );
}
