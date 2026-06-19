import { InsightKpiCard } from "@/components/marketing/insights/shared/InsightKpiCard";
import { YOUTUBE_COLOR } from "@/lib/constants/marketing-insights";
import { int } from "@/lib/marketing/ad-spend";
import type { YouTubeStats } from "@/types/marketing-insights";

/** KPIs do canal do YouTube (Seção 5.1). */
export function YouTubeChannelKpis({ latest }: { latest: YouTubeStats | null }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <InsightKpiCard
        color={YOUTUBE_COLOR}
        label="Inscritos"
        value={latest ? int(latest.subscriber_count) : "—"}
      />
      <InsightKpiCard
        label="Visualizações totais"
        value={latest ? int(latest.view_count) : "—"}
      />
      <InsightKpiCard label="Vídeos" value={latest ? int(latest.video_count) : "—"} />
    </div>
  );
}
