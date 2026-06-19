import { Lightbulb, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportHighlights } from "@/types/marketing-dashboard";

/** Destaques e recomendações do último relatório de IA. */
export function ReportHighlightsList({ data }: { data: ReportHighlights | null }) {
  const destaques = data?.destaques ?? [];
  const recomendacoes = data?.recomendacoes ?? [];
  const empty = destaques.length === 0 && recomendacoes.length === 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Destaques do último relatório</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {empty ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum relatório com destaques disponível.
          </p>
        ) : (
          <>
            {destaques.length > 0 && (
              <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  Destaques
                </p>
                <ul className="space-y-1 text-sm">
                  {destaques.slice(0, 5).map((d, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {recomendacoes.length > 0 && (
              <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Recomendações
                </p>
                <ul className="space-y-1 text-sm">
                  {recomendacoes.slice(0, 5).map((r, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
