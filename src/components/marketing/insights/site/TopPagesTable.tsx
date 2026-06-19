import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { int } from "@/lib/marketing/ad-spend";
import { formatDuration } from "@/lib/marketing/insights";
import type { SiteTopPage } from "@/types/marketing-insights";

/** Tabela de páginas mais vistas (Seção 5.2). */
export function TopPagesTable({ pages }: { pages: SiteTopPage[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Páginas mais vistas</CardTitle>
      </CardHeader>
      <CardContent>
        {pages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Sem dados no período.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-2 font-medium">Página</th>
                  <th className="py-2 pr-2 text-right font-medium">Views</th>
                  <th className="py-2 text-right font-medium">Tempo médio</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.page_path} className="border-b last:border-0">
                    <td className="max-w-[22rem] py-2 pr-2">
                      <p className="truncate font-medium">
                        {p.page_title || p.page_path}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.page_path}
                      </p>
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums">
                      {int(p.screen_page_views)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">
                      {formatDuration(p.avg_engagement_time)}
                    </td>
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
