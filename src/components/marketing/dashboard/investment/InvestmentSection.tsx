import { Coins, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import { CategorySection } from "@/components/marketing/dashboard/CategorySection";
import { KpiCard } from "@/components/marketing/dashboard/KpiCard";
import { DonutChart } from "@/components/marketing/dashboard/shared/DonutChart";
import { InvestmentVsReturnTable } from "@/components/marketing/dashboard/investment/InvestmentVsReturnTable";
import {
  getInvestmentComposition,
  getInvestmentKpis,
  getInvestmentReturnTable,
} from "@/server/queries/marketing/dashboard";
import { brl, deltaPct, int } from "@/lib/marketing/dashboard";
import type { DashboardPeriod } from "@/types/marketing-dashboard";

export async function InvestmentSection({ period }: { period: DashboardPeriod }) {
  const [{ current, previous }, composition, table] = await Promise.all([
    getInvestmentKpis(period),
    getInvestmentComposition(period),
    getInvestmentReturnTable(period),
  ]);

  const totalLeads = current.ads_leads + current.events_leads;

  return (
    <CategorySection
      title="Investimento Geral"
      description="Todo o investimento de marketing (ads + eventos) e o retorno."
      href="/modulos/marketing/midia-paga"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Investimento total"
          value={brl(current.total_investment)}
          deltaPct={deltaPct(current.total_investment, previous.total_investment)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <KpiCard
          label="Mídia paga vs eventos"
          value={brl(current.ads_investment)}
          sub={`+ ${brl(current.events_investment)} em eventos`}
          icon={<Coins className="h-4 w-4" />}
        />
        <KpiCard
          label="Custo por lead consolidado"
          value={current.cost_per_lead > 0 ? brl(current.cost_per_lead) : "—"}
          sub={`${int(totalLeads)} leads`}
          deltaPct={deltaPct(current.cost_per_lead, previous.cost_per_lead)}
          invertDelta
          icon={<PiggyBank className="h-4 w-4" />}
        />
        <KpiCard
          label="Retorno estimado"
          value={current.estimated_return > 0 ? brl(current.estimated_return) : "—"}
          deltaPct={deltaPct(current.estimated_return, previous.estimated_return)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DonutChart
          title="Composição do investimento"
          data={composition}
          formatValue={brl}
        />
        <InvestmentVsReturnTable rows={table} />
      </div>
    </CategorySection>
  );
}
