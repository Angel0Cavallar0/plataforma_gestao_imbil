import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "../shared/EmptyState";
import { competitorColor, isImbil } from "@/lib/marketing/competitors";
import { cn } from "@/lib/utils";
import type { TrendSeries } from "@/types/marketing-competitors";

/** Participação relativa de cada empresa no interesse total do período (Seção 8.2). */
export function ShareOfInterestCard({ series }: { series: TrendSeries[] }) {
  const totals = series
    .map((s, i) => ({
      empresa: s.empresa,
      total: s.points.reduce((acc, p) => acc + p.interest, 0),
      color: competitorColor(s.empresa, i),
    }))
    .filter((t) => t.total > 0);

  const grandTotal = totals.reduce((acc, t) => acc + t.total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Share of interest</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {grandTotal === 0 ? (
          <EmptyState message="Sem dados de interesse no período." />
        ) : (
          totals
            .sort((a, b) => b.total - a.total)
            .map((t) => {
              const pct = (t.total / grandTotal) * 100;
              return (
                <div key={t.empresa} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className={cn(isImbil(t.empresa) && "font-semibold")}>
                      {t.empresa}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: t.color }}
                    />
                  </div>
                </div>
              );
            })
        )}
      </CardContent>
    </Card>
  );
}
