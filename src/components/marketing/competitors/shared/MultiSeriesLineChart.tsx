"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltipContent } from "@/components/marketing/ad-spend/shared/ChartTooltipContent";
import { EmptyState } from "./EmptyState";
import { formatCompact, formatShortDate, IMBIL_COLOR } from "@/lib/marketing/competitors";

export type LineSeries = {
  key: string;
  label: string;
  color: string;
  points: { date: string; value: number }[];
};

/**
 * Gráfico de linhas multi-série genérico (evolução ao longo do tempo).
 * Mescla as séries por data; séries da Imbil (cor de destaque) ganham traço mais grosso.
 */
export function MultiSeriesLineChart({
  title,
  series,
  compact = true,
  domain,
  reversed = false,
  emptyMessage = "Sem histórico no período.",
}: {
  title: string;
  series: LineSeries[];
  compact?: boolean;
  domain?: [number, number];
  /** Inverte o eixo Y (ex.: posição no Google, onde menor é melhor). */
  reversed?: boolean;
  emptyMessage?: string;
}) {
  const dates = Array.from(
    new Set(series.flatMap((s) => s.points.map((p) => p.date))),
  ).sort();

  const data = dates.map((date) => {
    const row: Record<string, string | number | null> = { date };
    for (const s of series) {
      row[s.key] = s.points.find((p) => p.date === date)?.value ?? null;
    }
    return row;
  });

  const fmt = (v: number) =>
    compact ? formatCompact(v) : v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {series.length === 0 || data.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={formatShortDate}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                domain={domain}
                reversed={reversed}
                allowDecimals={false}
                tickFormatter={(v) => fmt(Number(v))}
                width={48}
              />
              <Tooltip
                content={
                  <ChartTooltipContent
                    formatLabel={(l) => formatShortDate(String(l))}
                    formatValue={fmt}
                  />
                }
              />
              <Legend />
              {series.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={s.color === IMBIL_COLOR ? 3 : 2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
