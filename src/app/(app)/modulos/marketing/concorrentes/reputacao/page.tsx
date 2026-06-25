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
  getImbilOverview,
  getImbilReviews,
} from "@/server/queries/marketing/competitors";
import {
  IMBIL_ID,
  IMBIL_NAME,
  type Competitor,
  type CompetitorReview,
} from "@/types/marketing-competitors";

const STARS = [5, 4, 3, 2, 1].map((s) => ({ value: String(s), label: `${s} estrelas` }));

/** Concorrente sintético da própria IMBIL (não existe em marketing.competitors). */
const IMBIL_COMPETITOR: Competitor = {
  id: IMBIL_ID,
  name: IMBIL_NAME,
  country: null,
  active: true,
  notes: null,
  ig_handle: null,
  yt_handle: null,
  yt_channel_id: null,
  fb_slug: null,
  fb_followers: null,
  google_rating: null,
  google_reviews_count: null,
  website_url: null,
  profile_updated_at: null,
};

export default async function ConcorrentesReputacaoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const competitorId = firstParam(sp.competitor);
  const ratingRaw = firstParam(sp.estrelas);
  const rating = ratingRaw ? Number(ratingRaw) : undefined;

  const isImbilSelected = competitorId === IMBIL_ID;

  const [competitors, overview, imbilOverview, competitorReviews, imbilReviews] =
    await Promise.all([
      getCompetitors(),
      getCompetitorsOverview(),
      getImbilOverview(),
      // Reviews dos concorrentes — omitidas quando só a IMBIL está selecionada.
      isImbilSelected
        ? Promise.resolve<CompetitorReview[]>([])
        : getCompetitorReviews(competitorId, rating),
      // Reviews da IMBIL — incluídas na visão "todos" ou quando a IMBIL é selecionada.
      competitorId && !isImbilSelected
        ? Promise.resolve<CompetitorReview[]>([])
        : getImbilReviews(rating),
    ]);

  // IMBIL no gráfico "Rating no Google"; anexada ao fim para não deslocar as cores.
  const overviewWithImbil = [...overview, imbilOverview];

  // IMBIL primeiro no seletor/feed; reviews ordenadas por data (mais recentes no topo).
  const competitorsWithImbil = [IMBIL_COMPETITOR, ...competitors];
  const reviews = [...imbilReviews, ...competitorReviews].sort((a, b) =>
    (b.data_publicacao ?? "").localeCompare(a.data_publicacao ?? ""),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Concorrentes — Reputação</h1>
        <p className="text-sm text-muted-foreground">
          Avaliações no Google: rating, distribuição de estrelas e reviews.
        </p>
      </div>

      <CompetitorsTabs />

      <RatingComparisonBars rows={overviewWithImbil} />

      <div className="flex flex-wrap items-center gap-3">
        <CompetitorSelector competitors={competitorsWithImbil} />
        <ParamSelect
          paramKey="estrelas"
          ariaLabel="Filtrar por nota"
          allLabel="Todas as notas"
          options={STARS}
          className="w-40"
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_2fr]">
        <StarDistribution reviews={reviews} />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Avaliações</h2>
          <ReviewsFeed reviews={reviews} competitors={competitorsWithImbil} />
        </div>
      </div>
    </div>
  );
}
