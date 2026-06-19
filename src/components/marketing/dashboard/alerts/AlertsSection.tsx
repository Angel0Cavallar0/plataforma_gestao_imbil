import { AlertTriangle, CalendarHeart, ShieldAlert } from "lucide-react";
import { CategorySection } from "@/components/marketing/dashboard/CategorySection";
import { KpiCard } from "@/components/marketing/dashboard/KpiCard";
import { SimpleBarChart } from "@/components/marketing/dashboard/shared/SimpleBarChart";
import { AlertsFeed } from "@/components/marketing/dashboard/alerts/AlertsFeed";
import { AlertRulesManager } from "@/components/marketing/dashboard/settings/AlertRulesManager";
import {
  getAlertRules,
  getAlertsBySource,
  getAlertsFeed,
  getAlertsKpis,
  getRelevantDates,
} from "@/server/queries/marketing/dashboard";
import { deltaPct, int, longDate } from "@/lib/marketing/dashboard";
import type { DashboardPeriod } from "@/types/marketing-dashboard";

function daysUntil(iso: string): number {
  const today = new Date();
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round((new Date(y, m - 1, d).getTime() - t.getTime()) / 86400000);
}

export async function AlertsSection({
  period,
  canManage,
}: {
  period: DashboardPeriod;
  canManage: boolean;
}) {
  const [{ current, previous }, feed, bySource, relevantDates, rules] = await Promise.all(
    [
      getAlertsKpis(period),
      getAlertsFeed(period),
      getAlertsBySource(period),
      getRelevantDates(),
      getAlertRules(),
    ],
  );

  // Datas dentro da janela de aviso (event_date - remind_days_before <= hoje).
  const upcomingWindow = relevantDates.filter(
    (r) => daysUntil(r.event_date) <= (r.remind_days_before ?? 7),
  );
  const nextDate = relevantDates[0];

  return (
    <CategorySection
      title="Alertas Inteligentes"
      description="Variações de performance detectadas e datas relevantes."
      href="/modulos/marketing/midia-paga"
      actions={<AlertRulesManager rules={rules} canManage={canManage} />}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Alertas no período"
          value={int(current.total)}
          deltaPct={deltaPct(current.total, previous.total)}
          invertDelta
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <KpiCard
          label="Alertas críticos"
          value={int(current.criticos)}
          sub="desvio ≥ 50%"
          deltaPct={deltaPct(current.criticos, previous.criticos)}
          invertDelta
          icon={<ShieldAlert className="h-4 w-4" />}
        />
        <KpiCard
          label="Datas relevantes próximas"
          value={int(upcomingWindow.length)}
          sub={
            nextDate ? `${nextDate.name} · ${longDate(nextDate.event_date)}` : "nenhuma"
          }
          icon={<CalendarHeart className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AlertsFeed alerts={feed} />
        <SimpleBarChart
          title="Alertas por fonte"
          horizontal
          data={bySource.map((s) => ({ name: s.source, value: s.count }))}
          valueFormat="int"
          emptyMessage="Sem alertas no período."
        />
      </div>
    </CategorySection>
  );
}
