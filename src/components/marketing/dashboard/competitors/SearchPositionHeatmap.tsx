import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SearchPositionHeatmapData } from "@/types/marketing-dashboard";

/** Cor de fundo por posição (1 = melhor/verde, pior = vermelho). */
function cellClass(pos: number | null): string {
  if (pos == null) return "bg-muted/40 text-muted-foreground";
  if (pos <= 3) return "bg-green-500/20 text-green-700 dark:text-green-300";
  if (pos <= 10) return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
  if (pos <= 20) return "bg-orange-500/20 text-orange-700 dark:text-orange-300";
  return "bg-red-500/20 text-red-700 dark:text-red-300";
}

const isImbil = (name: string) => name.toLowerCase() === "imbil";

/** Heatmap compacto de posição em busca por keyword (Imbil destacada). */
export function SearchPositionHeatmap({ data }: { data: SearchPositionHeatmapData }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Posição em busca por keyword</CardTitle>
      </CardHeader>
      <CardContent>
        {data.keywords.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sem ranking de busca no período.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-1 text-xs">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left font-medium text-muted-foreground">
                    Keyword
                  </th>
                  {data.companies.map((c) => (
                    <th
                      key={c}
                      className={cn(
                        "px-2 py-1 text-center font-medium",
                        isImbil(c) ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.keyword}>
                    <td
                      className="max-w-[12rem] truncate px-2 py-1 font-medium"
                      title={row.keyword}
                    >
                      {row.keyword}
                    </td>
                    {data.companies.map((c) => {
                      const pos = row.positions[c];
                      return (
                        <td
                          key={c}
                          className={cn(
                            "rounded px-2 py-1 text-center tabular-nums",
                            cellClass(pos),
                            isImbil(c) && "ring-1 ring-destructive/40",
                          )}
                        >
                          {pos != null ? pos : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
