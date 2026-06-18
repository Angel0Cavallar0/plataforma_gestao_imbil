import { AdSpendFilters } from "@/components/marketing/ad-spend/AdSpendFilters";
import { GenerateReportButton } from "@/components/marketing/insights/GenerateReportButton";
import { PaidDataPanels } from "@/components/marketing/insights/paid/PaidDataPanels";
import { parseAdSpendFilters } from "@/lib/marketing/ad-spend";
import {
  getRemainingReportQuota,
  getReportsWebhookUrl,
} from "@/server/queries/marketing/reports-control";

export default async function MidiaPagaInsightsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseAdSpendFilters(sp);

  const [remaining, webhookUrl] = await Promise.all([
    getRemainingReportQuota(),
    getReportsWebhookUrl(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Insights — Mídia Paga</h1>
          <p className="text-sm text-muted-foreground">
            Dados detalhados das campanhas de Meta Ads, Google Ads e LinkedIn Ads.
          </p>
        </div>
        <GenerateReportButton
          scope="midia_paga"
          remaining={remaining}
          webhookConfigured={webhookUrl.trim().length > 0}
        />
      </div>

      <AdSpendFilters filters={filters} />

      <PaidDataPanels filters={filters} />
    </div>
  );
}
