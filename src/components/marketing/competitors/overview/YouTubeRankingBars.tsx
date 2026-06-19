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
import { EmptyState } from "../shared/EmptyState";
import { competitorColor, formatCompact } from "@/lib/marketing/competitors";
import type { CompetitorOverview } from "@/types/marketing-competitors";

/** Ranking de inscritos no YouTube (barras horizontais) — Seção 5.3. */
export function YouTubeRankingBars({ rows }: { rows: CompetitorOverview[] }) {
  const data = rows
    .filter((r) => r.yt_subscribers != null)
    .map((r, i) => ({
      name: r.name,
      subscribers: r.yt_subscribers ?? 0,
      color: competitorColor(r.name, i),
    }))
    .sort((a, b) => b.subscribers - a.subscribers);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Inscritos no YouTube</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {data.length === 0 ? (
          <EmptyState message="Sem dados de YouTube." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 12, right: 16 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="opacity-30"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => formatCompact(v)}
              />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                content={<ChartTooltipContent formatValue={(v) => formatCompact(v)} />}
              />
              <Bar dataKey="subscribers" name="Inscritos" radius={[0, 4, 4, 0]}>
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
