import { YouTubeChannelKpis } from "@/components/marketing/insights/youtube/YouTubeChannelKpis";
import { SubscribersTrendChart } from "@/components/marketing/insights/youtube/SubscribersTrendChart";
import { YouTubeVideosGrid } from "@/components/marketing/insights/youtube/YouTubeVideosGrid";
import { getYouTube } from "@/server/queries/marketing/insights";

export default async function YouTubeInsightsPage() {
  const yt = await getYouTube();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Insights — YouTube</h1>
        <p className="text-sm text-muted-foreground">
          Inscritos, visualizações e vídeos do canal da Imbil.
        </p>
      </div>

      <YouTubeChannelKpis latest={yt.latest} />
      <SubscribersTrendChart history={yt.history} />
      <YouTubeVideosGrid videos={yt.videos} />
    </div>
  );
}
