"use client";

import { MultiSeriesLineChart, type LineSeries } from "../shared/MultiSeriesLineChart";
import { competitorColor } from "@/lib/marketing/competitors";
import type { TrendSeries } from "@/types/marketing-competitors";

/** Interesse de mercado (Google Trends) por empresa, incl. Imbil — Seção 8.2. */
export function TrendsLineChart({ series }: { series: TrendSeries[] }) {
  const lineSeries: LineSeries[] = series.map((s, i) => ({
    key: s.empresa,
    label: s.empresa,
    color: competitorColor(s.empresa, i),
    points: s.points.map((p) => ({ date: p.date, value: p.interest })),
  }));

  return (
    <MultiSeriesLineChart
      title="Interesse ao longo do tempo (Google Trends)"
      series={lineSeries}
      compact={false}
      domain={[0, 100]}
      emptyMessage="Sem dados de tendências para os filtros selecionados."
    />
  );
}
