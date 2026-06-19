"use client";

import { MultiSeriesLineChart, type LineSeries } from "../shared/MultiSeriesLineChart";
import { competitorColor } from "@/lib/marketing/competitors";
import type { KeywordRanking } from "@/types/marketing-competitors";

/** Evolução de posição no Google por empresa para uma keyword (Seção 8.1). */
export function KeywordPositionTrend({
  keyword,
  rankings,
}: {
  keyword: string;
  rankings: KeywordRanking[];
}) {
  const byCompetitor = new Map<string, LineSeries>();
  let colorIdx = 0;
  for (const r of rankings) {
    if (r.position == null) continue;
    let s = byCompetitor.get(r.competitor_name);
    if (!s) {
      s = {
        key: r.competitor_name,
        label: r.competitor_name,
        color: competitorColor(r.competitor_name, colorIdx++),
        points: [],
      };
      byCompetitor.set(r.competitor_name, s);
    }
    s.points.push({ date: r.data_referencia, value: r.position });
  }

  return (
    <MultiSeriesLineChart
      title={`Evolução de posição — "${keyword}"`}
      series={Array.from(byCompetitor.values())}
      compact={false}
      reversed
      emptyMessage="Sem histórico de posição para esta palavra-chave."
    />
  );
}
