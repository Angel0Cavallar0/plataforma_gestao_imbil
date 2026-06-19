"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltipContent } from "@/components/marketing/ad-spend/shared/ChartTooltipContent";
import { EmptyState } from "./EmptyState";
import { competitorColor, formatCompact } from "@/lib/marketing/competitors";

export type BarDatum = { name: string; value: number };

/** Barras comparativas genéricas por concorrente (horizontais), cores estáveis. */
export function CompetitorBars({
  title,
  data,
  seriesName,
  emptyMessage = "Sem dados.",
  formatValue = formatCompact,
}: {
  title: string;
  data: BarDatum[];
  seriesName: string;
  emptyMessage?: string;
  formatValue?: (v: number) => string;
}) {
  const rows = [...data].sort((a, b) => b.value - a.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {rows.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ left: 12, right: 16 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="opacity-30"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => formatValue(v)}
              />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                content={<ChartTooltipContent formatValue={formatValue} />}
              />
              <Bar dataKey="value" name={seriesName} radius={[0, 4, 4, 0]}>
                {rows.map((d, i) => (
                  <Cell key={d.name} fill={competitorColor(d.name, i)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
