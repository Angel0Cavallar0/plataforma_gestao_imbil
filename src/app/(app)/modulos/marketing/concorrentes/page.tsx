import { CompetitorsTabs } from "@/components/marketing/competitors/CompetitorsTabs";
import { OverviewKpis } from "@/components/marketing/competitors/overview/OverviewKpis";
import { CompetitorsComparisonTable } from "@/components/marketing/competitors/overview/CompetitorsComparisonTable";
import { YouTubeRankingBars } from "@/components/marketing/competitors/overview/YouTubeRankingBars";
import { RatingComparisonBars } from "@/components/marketing/competitors/overview/RatingComparisonBars";
import {
  getCompetitorsOverview,
  getImbilOverview,
} from "@/server/queries/marketing/competitors";

export default async function ConcorrentesPage() {
  const [overview, imbilOverview] = await Promise.all([
    getCompetitorsOverview(),
    getImbilOverview(),
  ]);

  // IMBIL anexada ao fim (não desloca as cores indexadas dos concorrentes nos gráficos).
  const overviewWithImbil = [...overview, imbilOverview];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Concorrentes</h1>
        <p className="text-sm text-muted-foreground">
          Inteligência competitiva no setor de bombas — visão consolidada.
        </p>
      </div>

      <CompetitorsTabs />

      <OverviewKpis rows={overview} />

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Comparativo</h2>
        <CompetitorsComparisonTable rows={overviewWithImbil} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <YouTubeRankingBars rows={overviewWithImbil} />
        <RatingComparisonBars rows={overviewWithImbil} />
      </div>
    </div>
  );
}
