import { CompetitorsTabs } from "@/components/marketing/competitors/CompetitorsTabs";
import { CompetitorSelector } from "@/components/marketing/competitors/CompetitorSelector";
import { CompetitorAdsGrid } from "@/components/marketing/competitors/ads/CompetitorAdsGrid";
import { firstParam } from "@/lib/marketing/competitors";
import { getCompetitorAds, getCompetitors } from "@/server/queries/marketing/competitors";

export default async function ConcorrentesAnunciosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const competitorId = firstParam(sp.competitor);

  const [competitors, ads] = await Promise.all([
    getCompetitors(),
    getCompetitorAds(competitorId),
  ]);

  const activeCount = ads.filter((a) => a.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Concorrentes — Anúncios</h1>
        <p className="text-sm text-muted-foreground">
          Meta Ad Library. Anúncios são raros neste setor — o estado vazio é o normal.
        </p>
      </div>

      <CompetitorsTabs />

      <div className="flex flex-wrap items-center gap-3">
        <CompetitorSelector competitors={competitors} />
        <span className="text-sm text-muted-foreground">
          {activeCount} anúncio(s) ativo(s) na seleção
        </span>
      </div>

      <CompetitorAdsGrid ads={ads} competitors={competitors} />
    </div>
  );
}
