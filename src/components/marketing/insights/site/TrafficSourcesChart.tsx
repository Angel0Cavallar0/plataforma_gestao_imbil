"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltipContent } from "@/components/marketing/ad-spend/shared/ChartTooltipContent";
import { int } from "@/lib/marketing/ad-spend";
import type { SiteTrafficSource } from "@/types/marketing-insights";

const PALETTE = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
];

/** Distribuição de sessões por canal de tráfego (Seção 5.2). */
export function TrafficSourcesChart({ sources }: { sources: SiteTrafficSource[] }) {
  const data = sources
    .filter((s) => s.sessions > 0)
    .map((s, i) => ({
      name: s.channel,
      value: s.sessions,
      color: PALETTE[i % PALETTE.length],
    }));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Canais de tráfego</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {data.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sem dados no período.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                label={({ name, value }) =>
                  `${name}: ${total > 0 ? Math.round((Number(value) / total) * 100) : 0}%`
                }
                labelLine={false}
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                content={<ChartTooltipContent formatValue={(v) => `${int(v)} sessões`} />}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
