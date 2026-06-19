import Link from "next/link";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DashboardAlert } from "@/types/marketing-dashboard";

/** Feed de alertas ordenado por severidade (|desvio|), com deep link. */
export function AlertsFeed({ alerts }: { alerts: DashboardAlert[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          Feed de alertas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum alerta no período. 🎉
          </p>
        ) : (
          <ul className="divide-y">
            {alerts.map((a) => {
              const dev = a.desvio_pct ?? 0;
              const critical = Math.abs(dev) >= 50;
              const down = dev < 0;
              return (
                <li key={a.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={critical ? "destructive" : "warning"}>
                        {a.fonte_normalizada}
                      </Badge>
                      {a.tipo ? (
                        <span className="text-sm font-medium">{a.tipo}</span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {a.campanha ? (
                        <span className="font-medium">{a.campanha} · </span>
                      ) : null}
                      {a.metrica}
                      {" · "}
                      {a.data_referencia}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums ${
                        down ? "text-destructive" : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {down ? (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      )}
                      {Math.abs(dev)}%
                    </span>
                    {a.link ? (
                      <Link
                        href={a.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                      >
                        abrir
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
