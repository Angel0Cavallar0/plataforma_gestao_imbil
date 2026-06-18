"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltipContent } from "@/components/marketing/ad-spend/shared/ChartTooltipContent";
import { NETWORKS } from "@/lib/constants/marketing-insights";
import { compactInt } from "@/lib/marketing/insights";
import type { NetworkOverview } from "@/types/marketing-insights";

const SERIES = [
  { key: "Curtidas", color: "#ef4444" },
  { key: "Comentários", color: "#3b82f6" },
  { key: "Compart.", color: "#22c55e" },
] as const;

/** Engajamento por rede (curtidas + comentários + compartilhamentos). Seção 3.4. */
export function EngagementByNetworkChart({ overview }: { overview: NetworkOverview[] }) {
  const data = overview.map((o) => ({
    network: NETWORKS[o.network].name,
    Curtidas: o.likes,
    Comentários: o.comments,
    "Compart.": o.shares,
  }));

  const hasData = data.some((d) => d.Curtidas + d.Comentários + d["Compart."] > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Engajamento por rede</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {!hasData ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sem dados no período.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="network" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => compactInt(Number(v))}
                width={48}
              />
              <Tooltip
                cursor={{ fill: "currentColor", opacity: 0.05 }}
                content={
                  <ChartTooltipContent formatValue={(v) => v.toLocaleString("pt-BR")} />
                }
              />
              <Legend />
              {SERIES.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  stackId="eng"
                  fill={s.color}
                  radius={[0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
