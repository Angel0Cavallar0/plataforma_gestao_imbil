import { Crown, Search, Star, TrendingUp, Users } from "lucide-react";
import { CategorySection } from "@/components/marketing/dashboard/CategorySection";
import { KpiCard } from "@/components/marketing/dashboard/KpiCard";
import { SimpleBarChart } from "@/components/marketing/dashboard/shared/SimpleBarChart";
import { TrendsBenchmarkLine } from "@/components/marketing/dashboard/competitors/TrendsBenchmarkLine";
import { SearchPositionHeatmap } from "@/components/marketing/dashboard/competitors/SearchPositionHeatmap";
import {
  getCompetitorsKpis,
  getSearchPositionHeatmap,
  getTrendsBenchmark,
  getYtBenchmark,
} from "@/server/queries/marketing/dashboard";
import { IMBIL_COLOR, compact, int } from "@/lib/marketing/dashboard";
import type { DashboardPeriod } from "@/types/marketing-dashboard";

export async function CompetitorsSection({ period }: { period: DashboardPeriod }) {
  const [{ current }, yt, trends, heatmap] = await Promise.all([
    getCompetitorsKpis(period),
    getYtBenchmark(),
    getTrendsBenchmark(period),
    getSearchPositionHeatmap(period),
  ]);

  const posDiff =
    current.imbil_position != null && current.competitors_position != null
      ? current.competitors_position - current.imbil_position
      : null;

  return (
    <CategorySection
      title="Concorrentes"
      description="Posição da Imbil frente aos concorrentes monitorados."
      href="/modulos/marketing/concorrentes"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Concorrentes ativos"
          value={int(current.ativos)}
          icon={<Users className="h-4 w-4" />}
        />
        <KpiCard
          label="Posição Imbil (busca)"
          value={current.imbil_position != null ? `${current.imbil_position}º` : "—"}
          sub={
            current.competitors_position != null
              ? `concorrentes: ${current.competitors_position}º`
              : undefined
          }
          icon={<Search className="h-4 w-4" />}
        />
        <KpiCard
          label="Share of interest"
          value={`${current.share_of_interest}%`}
          sub="Google Trends"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KpiCard
          label="Rating Imbil"
          value={current.imbil_rating != null ? `${current.imbil_rating} ★` : "—"}
          sub={
            current.competitors_rating != null
              ? `concorrentes: ${current.competitors_rating} ★`
              : undefined
          }
          icon={<Star className="h-4 w-4" />}
        />
        <KpiCard
          label="Líder YouTube"
          value={current.yt_leader ? current.yt_leader.name : "—"}
          sub={
            current.yt_leader
              ? `${compact(current.yt_leader.yt_subscribers)} inscritos`
              : undefined
          }
          icon={<Crown className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SimpleBarChart
          title="Inscritos no YouTube — Imbil × concorrentes"
          horizontal
          data={yt.map((r) => ({
            name: r.name,
            value: r.subscribers,
            color: r.isImbil ? IMBIL_COLOR : undefined,
          }))}
          formatValue={(v) => v.toLocaleString("pt-BR")}
        />
        <TrendsBenchmarkLine series={trends} />
      </div>

      <SearchPositionHeatmap data={heatmap} />
      {posDiff != null ? (
        <p className="text-xs text-muted-foreground">
          {posDiff > 0
            ? `A Imbil está, em média, ${posDiff.toFixed(1)} posições à frente dos concorrentes nas keywords monitoradas.`
            : posDiff < 0
              ? `A Imbil está, em média, ${Math.abs(posDiff).toFixed(1)} posições atrás dos concorrentes.`
              : "A Imbil está empatada com a média dos concorrentes em busca."}
        </p>
      ) : null}
    </CategorySection>
  );
}
