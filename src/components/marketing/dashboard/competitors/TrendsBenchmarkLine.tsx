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
import {
  CHART_PALETTE,
  IMBIL_COLOR,
  longDate,
  shortDate,
} from "@/lib/marketing/dashboard";
import type { TrendsBenchmarkSeries } from "@/types/marketing-dashboard";

/** Interesse no Google Trends: Imbil (vermelho, traço grosso) × concorrentes. */
export function TrendsBenchmarkLine({ series }: { series: TrendsBenchmarkSeries[] }) {
  const dates = [...new Set(series.flatMap((s) => s.points.map((p) => p.date)))].sort();
  const data = dates.map((date) => {
    const row: Record<string, string | number | null> = { date };
    for (const s of series) {
      row[s.name] = s.points.find((p) => p.date === date)?.value ?? null;
    }
    return row;
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Interesse de busca (Google Trends)</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {series.length === 0 ? (
          <p className="grid h-full place-items-center text-sm text-muted-foreground">
            Sem dados de tendências no período.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={32} />
              <Tooltip
                content={<ChartTooltipContent formatLabel={(l) => longDate(String(l))} />}
              />
              <Legend />
              {series.map((s, i) => (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  name={s.name}
                  stroke={
                    s.isImbil ? IMBIL_COLOR : CHART_PALETTE[i % CHART_PALETTE.length]
                  }
                  strokeWidth={s.isImbil ? 3 : 1.5}
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
