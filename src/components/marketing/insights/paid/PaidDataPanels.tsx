import { OverviewKpiCards } from "@/components/marketing/ad-spend/overview/OverviewKpiCards";
import { PlatformSplitCards } from "@/components/marketing/ad-spend/overview/PlatformSplitCards";
import { InvestmentShareDonut } from "@/components/marketing/ad-spend/overview/InvestmentShareDonut";
import { ConversionFunnelChart } from "@/components/marketing/ad-spend/overview/ConversionFunnelChart";
import { TrendLineChart } from "@/components/marketing/ad-spend/overview/TrendLineChart";
import { AllCampaignsTable } from "@/components/marketing/ad-spend/overview/AllCampaignsTable";
import {
  getCampaigns,
  getConversionFunnel,
  getOverviewKpis,
  getPlatformSplit,
  getTrend,
} from "@/server/queries/marketing/ad-spend";
import type { AdSpendFilters } from "@/types/marketing-ads";

/**
 * Aba "Mídia Paga" dos Insights — dados crus das 3 plataformas, reutilizando
 * os componentes e queries do submódulo mkt_midia-paga (Seção 4).
 */
export async function PaidDataPanels({ filters }: { filters: AdSpendFilters }) {
  const [kpis, split, funnel, campaigns, trendCpc, trendCpm, trendCtr] =
    await Promise.all([
      getOverviewKpis(filters),
      getPlatformSplit(filters),
      getConversionFunnel(filters),
      getCampaigns(filters),
      getTrend(filters, "cpc"),
      getTrend(filters, "cpm"),
      getTrend(filters, "ctr"),
    ]);

  return (
    <div className="space-y-6">
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
    </div>
  );
}
