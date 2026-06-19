"use client";

import { MultiSeriesLineChart, type LineSeries } from "../shared/MultiSeriesLineChart";
import { competitorColor } from "@/lib/marketing/competitors";
import type { SubscribersPoint } from "@/types/marketing-competitors";

/** Evolução de inscritos no YouTube por concorrente (Seção 7). */
export function YtSubscribersTrend({ points }: { points: SubscribersPoint[] }) {
  const byCompetitor = new Map<string, LineSeries>();
  let colorIdx = 0;
  for (const p of points) {
    let s = byCompetitor.get(p.competitorId);
    if (!s) {
      s = {
        key: p.competitorId,
        label: p.competitorName,
        color: competitorColor(p.competitorName, colorIdx++),
        points: [],
      };
      byCompetitor.set(p.competitorId, s);
    }
    s.points.push({ date: p.snapshot_date, value: p.subscribers });
  }

  return (
    <MultiSeriesLineChart
      title="Evolução de inscritos (YouTube)"
      series={Array.from(byCompetitor.values())}
      emptyMessage="Sem histórico de inscritos coletado."
    />
  );
}
