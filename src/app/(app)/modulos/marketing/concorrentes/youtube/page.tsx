import { CompetitorsTabs } from "@/components/marketing/competitors/CompetitorsTabs";
import { CompetitorSelector } from "@/components/marketing/competitors/CompetitorSelector";
import { YtSubscribersTrend } from "@/components/marketing/competitors/youtube/YtSubscribersTrend";
import { YtVideosGrid } from "@/components/marketing/competitors/youtube/YtVideosGrid";
import { CompetitorBars } from "@/components/marketing/competitors/shared/CompetitorBars";
import { firstParam, formatCompact } from "@/lib/marketing/competitors";
import {
  getCompetitors,
  getCompetitorsOverview,
  getSubscribersTrend,
  getYoutubeVideos,
} from "@/server/queries/marketing/competitors";

export default async function ConcorrentesYoutubePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const competitorId = firstParam(sp.competitor);

  const [competitors, overview, subscribers, videos] = await Promise.all([
    getCompetitors(),
    getCompetitorsOverview(),
    getSubscribersTrend(competitorId),
    getYoutubeVideos(competitorId, 60),
  ]);

  const subsBars = overview
    .filter((r) => r.yt_subscribers != null)
    .map((r) => ({ name: r.name, value: r.yt_subscribers ?? 0 }));

  const avgViewsBars = overview
    .filter((r) => r.yt_views != null && r.yt_videos)
    .map((r) => ({
      name: r.name,
      value: Math.round(Number(r.yt_views) / Number(r.yt_videos)),
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Concorrentes — YouTube</h1>
        <p className="text-sm text-muted-foreground">
          Inscritos, visualizações e vídeos por concorrente.
        </p>
      </div>

      <CompetitorsTabs />
      <CompetitorSelector competitors={competitors} />

      <YtSubscribersTrend points={subscribers} />

      <div className="grid gap-4 lg:grid-cols-2">
        <CompetitorBars
          title="Inscritos por concorrente"
          seriesName="Inscritos"
          data={subsBars}
          emptyMessage="Sem dados de inscritos."
          formatValue={formatCompact}
        />
        <CompetitorBars
          title="Média de views por vídeo"
          seriesName="Média de views"
          data={avgViewsBars}
          emptyMessage="Sem dados de visualizações."
          formatValue={formatCompact}
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Vídeos recentes</h2>
        <YtVideosGrid videos={videos} competitors={competitors} />
      </div>
    </div>
  );
}
