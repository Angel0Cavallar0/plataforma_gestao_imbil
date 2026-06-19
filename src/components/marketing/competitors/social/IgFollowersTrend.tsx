"use client";

import { MultiSeriesLineChart, type LineSeries } from "../shared/MultiSeriesLineChart";
import { competitorColor } from "@/lib/marketing/competitors";
import type { FollowersPoint } from "@/types/marketing-competitors";

/** Evolução de seguidores no Instagram por concorrente (Seção 6). */
export function IgFollowersTrend({ points }: { points: FollowersPoint[] }) {
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
    s.points.push({ date: p.snapshot_date, value: p.followers });
  }

  return (
    <MultiSeriesLineChart
      title="Evolução de seguidores (Instagram)"
      series={Array.from(byCompetitor.values())}
      emptyMessage="Sem histórico de seguidores coletado."
    />
  );
}
