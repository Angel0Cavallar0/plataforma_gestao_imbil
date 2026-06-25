import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "../shared/EmptyState";
import { competitorColor, formatNumber } from "@/lib/marketing/competitors";
import { IMBIL_NAME } from "@/types/marketing-competitors";
import type { CompetitorOverview } from "@/types/marketing-competitors";

/** Cards por concorrente com o total de seguidores no Instagram (Seção 6). */
export function IgFollowersCards({
  rows,
  imbilFollowers,
}: {
  rows: CompetitorOverview[];
  imbilFollowers?: number | null;
}) {
  const withData = rows.filter((r) => r.ig_followers != null);

  if (!withData.length && imbilFollowers == null) {
    return <EmptyState message="Nenhum dado de seguidores coletado." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {imbilFollowers != null && (
        <Card key="imbil">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: competitorColor(IMBIL_NAME, 0) }}
              />
              {IMBIL_NAME}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatNumber(imbilFollowers)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">seguidores</p>
          </CardContent>
        </Card>
      )}
      {withData
        .sort((a, b) => (b.ig_followers ?? 0) - (a.ig_followers ?? 0))
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
                {formatNumber(r.ig_followers)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {r.ig_handle ? `@${r.ig_handle}` : "seguidores"}
              </p>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
