import { PaidMediaTabs } from "@/components/marketing/ad-spend/PaidMediaTabs";
import { AdSpendFilters } from "@/components/marketing/ad-spend/AdSpendFilters";
import { ExportCsvButton } from "@/components/marketing/ad-spend/ExportCsvButton";
import { OverviewKpiCards } from "@/components/marketing/ad-spend/overview/OverviewKpiCards";
import { PlatformSplitCards } from "@/components/marketing/ad-spend/overview/PlatformSplitCards";
import { InvestmentShareDonut } from "@/components/marketing/ad-spend/overview/InvestmentShareDonut";
import { ConversionFunnelChart } from "@/components/marketing/ad-spend/overview/ConversionFunnelChart";
import { TrendLineChart } from "@/components/marketing/ad-spend/overview/TrendLineChart";
import { AllCampaignsTable } from "@/components/marketing/ad-spend/overview/AllCampaignsTable";
import { IntegrationHealthIndicator } from "@/components/marketing/ad-spend/IntegrationHealthIndicator";
import { parseAdSpendFilters } from "@/lib/marketing/ad-spend";
import {
  getCampaigns,
  getConversionFunnel,
  getIntegrationHealth,
  getOverviewKpis,
  getPlatformSplit,
  getTrend,
} from "@/server/queries/marketing/ad-spend";

export default async function MidiaPagaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseAdSpendFilters(sp);

  const [kpis, split, funnel, campaigns, health, trendCpc, trendCpm, trendCtr] =
    await Promise.all([
      getOverviewKpis(filters),
      getPlatformSplit(filters),
      getConversionFunnel(filters),
      getCampaigns(filters),
      getIntegrationHealth(),
      getTrend(filters, "cpc"),
      getTrend(filters, "cpm"),
      getTrend(filters, "ctr"),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Mídia Paga &amp; Investimentos</h1>
          <p className="text-sm text-muted-foreground">
            Meta Ads, Google Ads e LinkedIn Ads em um só lugar.
          </p>
        </div>
        <ExportCsvButton filters={filters} />
      </div>

      <PaidMediaTabs />
      <AdSpendFilters filters={filters} />

      <OverviewKpiCards kpis={kpis} />
      <PlatformSplitCards split={split} />

      <div className="grid gap-4 lg:grid-cols-2">
        <InvestmentShareDonut split={split} />
        <ConversionFunnelChart rows={funnel} />
      </div>

      <TrendLineChart series={{ cpc: trendCpc, cpm: trendCpm, ctr: trendCtr }} />

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Campanhas</h2>
        <AllCampaignsTable campaigns={campaigns} />
      </div>

      <IntegrationHealthIndicator rows={health} />
    </div>
  );
}
