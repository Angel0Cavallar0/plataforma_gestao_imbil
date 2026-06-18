import { InsightKpiCard } from "@/components/marketing/insights/shared/InsightKpiCard";
import { int, pct } from "@/lib/marketing/ad-spend";
import { formatDuration } from "@/lib/marketing/insights";
import type { SiteDailyRow } from "@/types/marketing-insights";

function n(v: number | null | undefined): number {
  return v == null || Number.isNaN(v) ? 0 : v;
}

/** KPIs do site (Google Analytics) no período (Seção 5.2). */
export function SiteKpis({ daily }: { daily: SiteDailyRow[] }) {
  const sessions = daily.reduce((s, r) => s + n(r.sessions), 0);
  const users = daily.reduce((s, r) => s + n(r.total_users), 0);
  const newUsers = daily.reduce((s, r) => s + n(r.new_users), 0);
  const pageviews = daily.reduce((s, r) => s + n(r.screen_page_views), 0);

  // Médias ponderadas por sessões.
  let bounceWeighted = 0;
  let durWeighted = 0;
  let weight = 0;
  for (const r of daily) {
    const w = n(r.sessions);
    weight += w;
    if (r.bounce_rate != null) bounceWeighted += r.bounce_rate * w;
    if (r.avg_session_duration != null) durWeighted += r.avg_session_duration * w;
  }
  const bounce = weight > 0 ? bounceWeighted / weight : null;
  const duration = weight > 0 ? durWeighted / weight : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <InsightKpiCard
        label="Sessões"
        value={int(sessions)}
        sub={`${int(pageviews)} pageviews`}
      />
      <InsightKpiCard label="Usuários" value={int(users)} />
      <InsightKpiCard label="Novos usuários" value={int(newUsers)} />
      <InsightKpiCard
        label="Taxa de rejeição"
        value={bounce != null ? pct(bounce) : "—"}
      />
      <InsightKpiCard label="Duração média" value={formatDuration(duration)} />
    </div>
  );
}
