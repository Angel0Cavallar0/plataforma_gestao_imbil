import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { brl, int, pct } from "@/lib/marketing/ad-spend";
import { MetricInfo } from "@/components/marketing/ad-spend/shared/MetricInfo";
import { GOOGLE_TOOLTIPS } from "@/lib/constants/midia-paga-tooltips";
import type { GoogleSummary } from "@/lib/marketing/platform-metrics";

/** Painel de métricas exclusivas do Google (Seção 6.4). */
export function GoogleMetricsPanel({ summary }: { summary: GoogleSummary }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Leilão (Search)</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="flex items-center text-muted-foreground">
              Impression Share
              <MetricInfo text={GOOGLE_TOOLTIPS.impression_share} />
            </dt>
            <dd className="text-right tabular-nums">
              {pct(summary.search_impression_share)}
            </dd>
            <dt className="flex items-center text-muted-foreground">
              Perdido por orçamento
              <MetricInfo text={GOOGLE_TOOLTIPS.lost_budget} />
            </dt>
            <dd className="text-right tabular-nums">
              {pct(summary.search_budget_lost_is)}
            </dd>
            <dt className="flex items-center text-muted-foreground">
              Perdido por ranking
              <MetricInfo text={GOOGLE_TOOLTIPS.lost_rank} />
            </dt>
            <dd className="text-right tabular-nums">
              {pct(summary.search_rank_lost_is)}
            </dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Vídeo</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Visualizações</dt>
            <dd className="text-right tabular-nums">{int(summary.video_views)}</dd>
            <dt className="text-muted-foreground">CPV</dt>
            <dd className="text-right tabular-nums">{brl(summary.cpv)}</dd>
            {summary.videoQuartiles ? (
              <>
                <dt className="text-muted-foreground">25% (taxa média)</dt>
                <dd className="text-right tabular-nums">
                  {pct(summary.videoQuartiles.p25)}
                </dd>
                <dt className="text-muted-foreground">50% (taxa média)</dt>
                <dd className="text-right tabular-nums">
                  {pct(summary.videoQuartiles.p50)}
                </dd>
                <dt className="text-muted-foreground">75% (taxa média)</dt>
                <dd className="text-right tabular-nums">
                  {pct(summary.videoQuartiles.p75)}
                </dd>
                <dt className="text-muted-foreground">100% (taxa média)</dt>
                <dd className="text-right tabular-nums">
                  {pct(summary.videoQuartiles.p100)}
                </dd>
              </>
            ) : (
              <dd className="col-span-2 text-xs text-muted-foreground">
                Sem quartis de vídeo no período (campanhas Search).
              </dd>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
