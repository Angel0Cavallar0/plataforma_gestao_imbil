import { DollarSign, MousePointerClick, Percent, Target, TrendingUp } from "lucide-react";
import { CategorySection } from "@/components/marketing/dashboard/CategorySection";
import { KpiCard } from "@/components/marketing/dashboard/KpiCard";
import { SimpleBarChart } from "@/components/marketing/dashboard/shared/SimpleBarChart";
import { ConversionFunnel } from "@/components/marketing/dashboard/paid/ConversionFunnel";
import {
  getConversionFunnel,
  getInvestmentByPlatform,
  getPaidKpis,
} from "@/server/queries/marketing/dashboard";
import { brl, deltaPct, int, pct, roasLabel } from "@/lib/marketing/dashboard";
import type { DashboardPeriod } from "@/types/marketing-dashboard";

export async function PaidSection({ period }: { period: DashboardPeriod }) {
  const [{ current, previous }, byPlatform, funnel] = await Promise.all([
    getPaidKpis(period),
    getInvestmentByPlatform(period),
    getConversionFunnel(period),
  ]);

  return (
    <CategorySection
      title="Mídia Paga"
      description="Investimento em anúncios e eficiência das campanhas."
      href="/modulos/marketing/midia-paga"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Investimento em ads"
          value={brl(current.spend)}
          deltaPct={deltaPct(current.spend, previous.spend)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KpiCard
          label="Cliques"
          value={int(current.clicks)}
          sub={`${int(current.impressions)} impressões`}
          deltaPct={deltaPct(current.clicks, previous.clicks)}
          icon={<MousePointerClick className="h-4 w-4" />}
        />
        <KpiCard
          label="CTR médio"
          value={pct(current.ctr)}
          deltaPct={deltaPct(current.ctr, previous.ctr)}
          icon={<Percent className="h-4 w-4" />}
        />
        <KpiCard
          label="Custo por resultado"
          value={current.cost_per_result > 0 ? brl(current.cost_per_result) : "—"}
          deltaPct={deltaPct(current.cost_per_result, previous.cost_per_result)}
          invertDelta
          icon={<Target className="h-4 w-4" />}
        />
        <KpiCard
          label="ROAS"
          value={current.roas > 0 ? roasLabel(current.roas) : "—"}
          sub="LinkedIn sem conversão"
          deltaPct={deltaPct(current.roas, previous.roas)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SimpleBarChart
          title="Investimento por plataforma"
          data={byPlatform.map((p) => ({ name: p.platform, value: p.spend }))}
          formatValue={brl}
        />
        <ConversionFunnel data={funnel} />
      </div>
    </CategorySection>
  );
}
