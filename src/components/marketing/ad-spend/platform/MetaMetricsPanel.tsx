import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { int } from "@/lib/marketing/ad-spend";
import { MetricInfo } from "@/components/marketing/ad-spend/shared/MetricInfo";
import { META_TOOLTIPS } from "@/lib/constants/midia-paga-tooltips";
import type { MetaSummary } from "@/lib/marketing/platform-metrics";

const RANKING_VARIANT: Record<string, "success" | "warning" | "destructive" | "muted"> = {
  above_average: "success",
  average: "warning",
  below_average_10: "destructive",
  below_average_20: "destructive",
  below_average_35: "destructive",
};

function RankingRow({
  label,
  info,
  dist,
}: {
  label: string;
  info: string;
  dist: Record<string, number>;
}) {
  const entries = Object.entries(dist);
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center text-sm text-muted-foreground">
        {label}
        <MetricInfo text={info} />
      </span>
      <span className="flex flex-wrap justify-end gap-1">
        {entries.length === 0 ? (
          <span className="text-xs text-muted-foreground">sem dado</span>
        ) : (
          entries.map(([k, v]) => (
            <Badge key={k} variant={RANKING_VARIANT[k] ?? "muted"}>
              {k.replace(/_/g, " ")}: {v}
            </Badge>
          ))
        )}
      </span>
    </div>
  );
}

function VideoRow({
  label,
  info,
  value,
}: {
  label: string;
  info: string;
  value: number;
}) {
  return (
    <>
      <dt className="flex items-center text-muted-foreground">
        {label}
        <MetricInfo text={info} />
      </dt>
      <dd className="text-right tabular-nums">{int(value)}</dd>
    </>
  );
}

/** Painel de métricas exclusivas do Meta (Seção 6.4). */
export function MetaMetricsPanel({ summary }: { summary: MetaSummary }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Rankings de qualidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Distribuição dos anúncios pelo estado mais recente de cada ranking.
          </p>
          <RankingRow
            label="Qualidade"
            info={META_TOOLTIPS.ranking_quality}
            dist={summary.rankings.quality}
          />
          <RankingRow
            label="Engajamento"
            info={META_TOOLTIPS.ranking_engagement}
            dist={summary.rankings.engagement}
          />
          <RankingRow
            label="Conversão"
            info={META_TOOLTIPS.ranking_conversion}
            dist={summary.rankings.conversion}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Métricas de vídeo</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <VideoRow
              label="ThruPlays"
              info={META_TOOLTIPS.thruplays}
              value={summary.video.thruplay}
            />
            <VideoRow
              label="25% assistido"
              info={META_TOOLTIPS.video_p25}
              value={summary.video.p25}
            />
            <VideoRow
              label="50% assistido"
              info={META_TOOLTIPS.video_p50}
              value={summary.video.p50}
            />
            <VideoRow
              label="75% assistido"
              info={META_TOOLTIPS.video_p75}
              value={summary.video.p75}
            />
            <VideoRow
              label="100% assistido"
              info={META_TOOLTIPS.video_p100}
              value={summary.video.p100}
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
