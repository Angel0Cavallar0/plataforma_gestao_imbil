import { CompetitorsTabs } from "@/components/marketing/competitors/CompetitorsTabs";
import { CompetitorSelector } from "@/components/marketing/competitors/CompetitorSelector";
import { ParamSelect } from "@/components/marketing/competitors/shared/ParamSelect";
import { CompetitorNewsFeed } from "@/components/marketing/competitors/news/CompetitorNewsFeed";
import { firstParam } from "@/lib/marketing/competitors";
import {
  getCompetitorNews,
  getCompetitors,
} from "@/server/queries/marketing/competitors";

const PERIODS = [
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "365", label: "Último ano" },
];

export default async function ConcorrentesNoticiasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const competitorId = firstParam(sp.competitor);
  const periodRaw = firstParam(sp.periodo);
  const days = periodRaw ? Number(periodRaw) : undefined;

  const [competitors, news] = await Promise.all([
    getCompetitors(),
    getCompetitorNews(competitorId, days),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Concorrentes — Notícias</h1>
        <p className="text-sm text-muted-foreground">
          Cobertura de imprensa sobre os concorrentes monitorados.
        </p>
      </div>

      <CompetitorsTabs />

      <div className="flex flex-wrap items-center gap-3">
        <CompetitorSelector competitors={competitors} />
        <ParamSelect
          paramKey="periodo"
          ariaLabel="Filtrar por período"
          allLabel="Todo o período"
          options={PERIODS}
          className="w-48"
        />
      </div>

      <CompetitorNewsFeed news={news} competitors={competitors} />
    </div>
  );
}
