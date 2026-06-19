import { CalendarClock, Coins, TrendingUp, UserPlus } from "lucide-react";
import { CategorySection } from "@/components/marketing/dashboard/CategorySection";
import { KpiCard } from "@/components/marketing/dashboard/KpiCard";
import { SimpleBarChart } from "@/components/marketing/dashboard/shared/SimpleBarChart";
import { UpcomingEventsTimeline } from "@/components/marketing/dashboard/events/UpcomingEventsTimeline";
import {
  getEventsKpis,
  getEventsPipeline,
  getUpcomingEvents,
} from "@/server/queries/marketing/dashboard";
import {
  EVENT_PIPELINE_ORDER,
  EVENT_STATUS_LABELS,
  brl,
  deltaPct,
  int,
  longDate,
  pct,
} from "@/lib/marketing/dashboard";
import type { DashboardPeriod } from "@/types/marketing-dashboard";

function daysUntil(iso: string): number {
  const today = new Date();
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round((new Date(y, m - 1, d).getTime() - t.getTime()) / 86400000);
}

export async function EventsSection({ period }: { period: DashboardPeriod }) {
  const [{ current, previous }, pipeline, upcoming] = await Promise.all([
    getEventsKpis(period),
    getEventsPipeline(),
    getUpcomingEvents(),
  ]);

  const prox = current.proximo_evento;
  const proxDays = prox ? daysUntil(prox.starts_on) : null;

  const pipelineCounts = new Map(pipeline.map((p) => [p.status, p.count]));
  const pipelineData = EVENT_PIPELINE_ORDER.map((status) => ({
    name: EVENT_STATUS_LABELS[status],
    value: pipelineCounts.get(status) ?? 0,
  }));

  return (
    <CategorySection
      title="Eventos"
      description="Pipeline de eventos, leads capturados e ROI."
      href="/modulos/marketing/eventos"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Próximo evento"
          value={prox ? prox.name : "—"}
          sub={
            prox
              ? `${longDate(prox.starts_on)} · ${proxDays === 0 ? "hoje" : `em ${proxDays}d`}`
              : "nenhum agendado"
          }
          icon={<CalendarClock className="h-4 w-4" />}
        />
        <KpiCard
          label="Leads em eventos"
          value={int(current.leads_periodo)}
          deltaPct={deltaPct(current.leads_periodo, previous.leads_periodo)}
          icon={<UserPlus className="h-4 w-4" />}
        />
        <KpiCard
          label="CPL de eventos"
          value={current.cpl > 0 ? brl(current.cpl) : "—"}
          deltaPct={deltaPct(current.cpl, previous.cpl)}
          invertDelta
          icon={<Coins className="h-4 w-4" />}
        />
        <KpiCard
          label="ROI médio (realizados)"
          value={current.roi_medio ? pct(current.roi_medio) : "—"}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SimpleBarChart
          title="Pipeline de eventos por status"
          data={pipelineData}
          valueFormat="int"
          emptyMessage="Nenhum evento cadastrado."
        />
        <UpcomingEventsTimeline events={upcoming} />
      </div>
    </CategorySection>
  );
}
