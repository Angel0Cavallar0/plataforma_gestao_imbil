import { TriangleAlert } from "lucide-react";
import { InsightsFilters } from "@/components/marketing/insights/InsightsFilters";
import { SiteKpis } from "@/components/marketing/insights/site/SiteKpis";
import { SessionsTrendChart } from "@/components/marketing/insights/site/SessionsTrendChart";
import { TopPagesTable } from "@/components/marketing/insights/site/TopPagesTable";
import { TrafficSourcesChart } from "@/components/marketing/insights/site/TrafficSourcesChart";
import { parseInsightsFilters } from "@/lib/marketing/insights";
import { getSiteAnalytics } from "@/server/queries/marketing/insights";

export default async function SiteInsightsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseInsightsFilters(await searchParams);
  const site = await getSiteAnalytics(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Insights — Acessos do Site</h1>
        <p className="text-sm text-muted-foreground">
          Sessões, páginas mais vistas e fontes de tráfego (Google Analytics).
        </p>
      </div>

      <InsightsFilters filters={filters} />

      {site.daysCovered > 0 && site.daysCovered <= 7 && (
        <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <TriangleAlert className="h-4 w-4 shrink-0" />
          Histórico curto: apenas {site.daysCovered}{" "}
          {site.daysCovered === 1 ? "dia" : "dias"} de dados disponíveis no período.
        </div>
      )}

      <SiteKpis daily={site.daily} />
      <SessionsTrendChart daily={site.daily} />
      <div className="grid gap-4 lg:grid-cols-2">
        <TopPagesTable pages={site.topPages} />
        <TrafficSourcesChart sources={site.sources} />
      </div>
    </div>
  );
}
