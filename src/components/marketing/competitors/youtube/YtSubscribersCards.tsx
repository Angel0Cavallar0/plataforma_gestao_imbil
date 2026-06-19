import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "../shared/EmptyState";
import { competitorColor, formatNumber } from "@/lib/marketing/competitors";
import type { CompetitorOverview } from "@/types/marketing-competitors";

/** Cards por concorrente com o total de inscritos no YouTube (Seção 7). */
export function YtSubscribersCards({ rows }: { rows: CompetitorOverview[] }) {
  const withData = rows.filter((r) => r.yt_subscribers != null);

  if (!withData.length) {
    return <EmptyState message="Nenhum dado de inscritos coletado." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {withData
        .sort((a, b) => (b.yt_subscribers ?? 0) - (a.yt_subscribers ?? 0))
        .map((r, i) => (
          <Card key={r.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: competitorColor(r.name, i) }}
                />
                {r.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">
                {formatNumber(r.yt_subscribers)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {r.yt_handle ?? "inscritos"}
              </p>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
