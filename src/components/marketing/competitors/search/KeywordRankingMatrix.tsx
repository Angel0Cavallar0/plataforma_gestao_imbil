import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "../shared/EmptyState";
import { cn } from "@/lib/utils";
import { formatDate, isImbil } from "@/lib/marketing/competitors";
import type { KeywordMatrix } from "@/types/marketing-competitors";

/** Classe de cor da célula conforme a posição no Google (verde/amarelo/vermelho). */
function cellClass(pos: number | null): string {
  if (pos == null) return "text-muted-foreground";
  if (pos <= 3) return "bg-green-500/15 text-green-700 dark:text-green-400 font-semibold";
  if (pos <= 10) return "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-medium";
  return "bg-red-500/15 text-red-700 dark:text-red-400";
}

/** Matriz keyword × concorrente (com Imbil destacada) — Seção 8.1. */
export function KeywordRankingMatrix({ matrix }: { matrix: KeywordMatrix }) {
  if (!matrix.keywords.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ranking de palavras-chave</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState message="Sem dados de ranking coletados." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
          <span>Ranking de palavras-chave no Google</span>
          <span className="text-xs font-normal text-muted-foreground">
            Posição em {formatDate(matrix.date)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Palavra-chave</th>
                {matrix.competitors.map((c) => (
                  <th
                    key={c}
                    className={cn(
                      "px-3 py-2 text-center font-medium",
                      isImbil(c) && "bg-foreground/5 text-foreground underline",
                    )}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.keywords.map((kw) => (
                <tr key={kw} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{kw}</td>
                  {matrix.competitors.map((c) => {
                    const pos = matrix.positions[kw]?.[c] ?? null;
                    return (
                      <td
                        key={c}
                        className={cn(
                          "px-3 py-2 text-center tabular-nums",
                          cellClass(pos),
                          isImbil(c) && "ring-1 ring-inset ring-foreground/20",
                        )}
                      >
                        {pos ?? "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-green-500/40" /> Top 3
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-amber-500/40" /> 4–10
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-red-500/40" /> Acima de 10
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
