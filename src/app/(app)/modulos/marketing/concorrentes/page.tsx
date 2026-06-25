import { CompetitorsTabs } from "@/components/marketing/competitors/CompetitorsTabs";
import { FreshnessNote } from "@/components/marketing/competitors/shared/FreshnessNote";
import { OverviewKpis } from "@/components/marketing/competitors/overview/OverviewKpis";
import { CompetitorsComparisonTable } from "@/components/marketing/competitors/overview/CompetitorsComparisonTable";
import { YouTubeRankingBars } from "@/components/marketing/competitors/overview/YouTubeRankingBars";
import { RatingComparisonBars } from "@/components/marketing/competitors/overview/RatingComparisonBars";
import {
  getCompetitorsOverview,
  getImbilOverview,
  getLastCollectedAt,
} from "@/server/queries/marketing/competitors";

export default async function ConcorrentesPage() {
  const [overview, imbilOverview, lastCollectedAt] = await Promise.all([
    getCompetitorsOverview(),
    getImbilOverview(),
    getLastCollectedAt(),
  ]);

  // IMBIL anexada ao fim (não desloca as cores indexadas dos concorrentes nos gráficos).
  const overviewWithImbil = [...overview, imbilOverview];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Concorrentes</h1>
          <p className="text-sm text-muted-foreground">
            Inteligência competitiva no setor de bombas — visão consolidada.
          </p>
        </div>
        <FreshnessNote lastCollectedAt={lastCollectedAt} />
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
