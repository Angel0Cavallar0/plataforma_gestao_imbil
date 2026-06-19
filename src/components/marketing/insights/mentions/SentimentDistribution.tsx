import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InsightKpiCard } from "@/components/marketing/insights/shared/InsightKpiCard";
import {
  mentionPlatformColor,
  mentionPlatformLabel,
} from "@/lib/constants/marketing-insights";
import { int } from "@/lib/marketing/ad-spend";
import type { MentionsData } from "@/types/marketing-insights";

/** KPIs + distribuição por plataforma e por nota (Seção 5.3). */
export function SentimentDistribution({ data }: { data: MentionsData }) {
  const maxPlatform = Math.max(1, ...data.byPlatform.map((p) => p.count));
  const maxRating = Math.max(1, ...data.ratingDistribution.map((r) => r.count));

  const responded = data.mentions.filter((m) => m.respondida).length;
  const pending = data.total - responded;
  const pctResponded = data.total > 0 ? Math.round((responded / data.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InsightKpiCard label="Total de menções" value={int(data.total)} />
        <InsightKpiCard
          label="Avaliações Google"
          value={
            data.ratingsAvg != null ? (
              <span className="inline-flex items-center gap-1">
                {data.ratingsAvg.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              </span>
            ) : (
              "—"
            )
          }
          sub={`${data.ratingsCount} ${data.ratingsCount === 1 ? "avaliação" : "avaliações"}`}
        />
        <InsightKpiCard
          label="Plataformas"
          value={int(data.byPlatform.length)}
          sub="com menções no período"
        />
        <InsightKpiCard
          label="Interações respondidas"
          value={`${int(responded)}/${int(data.total)}`}
          sub={
            <>
              {int(pending)} a responder · {pctResponded}% respondidas
              <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-green-500"
                  style={{ width: `${pctResponded}%` }}
                />
              </span>
            </>
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Menções por plataforma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.byPlatform.map((p) => (
              <div key={p.plataforma} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span>{mentionPlatformLabel(p.plataforma)}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {int(p.count)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(p.count / maxPlatform) * 100}%`,
                      backgroundColor: mentionPlatformColor(p.plataforma),
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {data.ratingsCount > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Distribuição de notas (Google Meu Negócio)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.ratingDistribution.map((r) => (
                <div key={r.stars} className="flex items-center gap-2">
                  <span className="inline-flex w-10 items-center gap-0.5 text-xs tabular-nums">
                    {r.stars}
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${(r.count / maxRating) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
                    {int(r.count)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
