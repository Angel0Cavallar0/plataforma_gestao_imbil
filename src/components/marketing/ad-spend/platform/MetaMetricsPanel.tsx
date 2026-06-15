import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { int } from "@/lib/marketing/ad-spend";
import type { MetaSummary } from "@/lib/marketing/platform-metrics";

const RANKING_VARIANT: Record<string, "success" | "warning" | "destructive" | "muted"> = {
  above_average: "success",
  average: "warning",
  below_average_10: "destructive",
  below_average_20: "destructive",
  below_average_35: "destructive",
};

function RankingRow({ label, dist }: { label: string; dist: Record<string, number> }) {
  const entries = Object.entries(dist);
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
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
          <RankingRow label="Qualidade" dist={summary.rankings.quality} />
          <RankingRow label="Engajamento" dist={summary.rankings.engagement} />
          <RankingRow label="Conversão" dist={summary.rankings.conversion} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Métricas de vídeo</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">ThruPlays</dt>
            <dd className="text-right tabular-nums">{int(summary.video.thruplay)}</dd>
            <dt className="text-muted-foreground">25% assistido</dt>
            <dd className="text-right tabular-nums">{int(summary.video.p25)}</dd>
            <dt className="text-muted-foreground">50% assistido</dt>
            <dd className="text-right tabular-nums">{int(summary.video.p50)}</dd>
            <dt className="text-muted-foreground">75% assistido</dt>
            <dd className="text-right tabular-nums">{int(summary.video.p75)}</dd>
            <dt className="text-muted-foreground">100% assistido</dt>
            <dd className="text-right tabular-nums">{int(summary.video.p100)}</dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
