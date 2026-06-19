import { CompetitorsTabs } from "@/components/marketing/competitors/CompetitorsTabs";
import { CompetitorSelector } from "@/components/marketing/competitors/CompetitorSelector";
import { ParamSelect } from "@/components/marketing/competitors/shared/ParamSelect";
import { RatingComparisonBars } from "@/components/marketing/competitors/overview/RatingComparisonBars";
import { ReviewsFeed } from "@/components/marketing/competitors/reputation/ReviewsFeed";
import { StarDistribution } from "@/components/marketing/competitors/reputation/StarDistribution";
import { firstParam } from "@/lib/marketing/competitors";
import {
  getCompetitorReviews,
  getCompetitors,
  getCompetitorsOverview,
} from "@/server/queries/marketing/competitors";

const STARS = [5, 4, 3, 2, 1].map((s) => ({ value: String(s), label: `${s} estrelas` }));

export default async function ConcorrentesReputacaoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const competitorId = firstParam(sp.competitor);
  const ratingRaw = firstParam(sp.estrelas);
  const rating = ratingRaw ? Number(ratingRaw) : undefined;

  const [competitors, overview, reviews] = await Promise.all([
    getCompetitors(),
    getCompetitorsOverview(),
    getCompetitorReviews(competitorId, rating),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Concorrentes — Reputação</h1>
        <p className="text-sm text-muted-foreground">
          Avaliações no Google: rating, distribuição de estrelas e reviews.
        </p>
      </div>

      <CompetitorsTabs />

      <RatingComparisonBars rows={overview} />

      <div className="flex flex-wrap items-center gap-3">
        <CompetitorSelector competitors={competitors} />
        <ParamSelect
          paramKey="estrelas"
          ariaLabel="Filtrar por nota"
          allLabel="Todas as notas"
          options={STARS}
          className="w-40"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <StarDistribution reviews={reviews} />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Avaliações</h2>
          <ReviewsFeed reviews={reviews} competitors={competitors} />
        </div>
      </div>
    </div>
  );
}
