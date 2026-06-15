"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AD_PLATFORMS } from "@/lib/constants/marketing-ads";
import { brl } from "@/lib/marketing/ad-spend";
import { chartTooltipProps } from "@/components/marketing/ad-spend/shared/chart-theme";
import type { PlatformSummary } from "@/types/marketing-ads";

/** Donut de share de investimento por plataforma (Seção 7.3). */
export function InvestmentShareDonut({ split }: { split: PlatformSummary[] }) {
  const data = split
    .filter((s) => s.spend > 0)
    .map((s) => ({
      name: AD_PLATFORMS[s.platform_slug].name,
      value: Math.round(s.spend * 100) / 100,
      color: AD_PLATFORMS[s.platform_slug].color,
    }));

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Share de investimento</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {data.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sem investimento no período.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={95}
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
              <Tooltip {...chartTooltipProps} formatter={(value) => brl(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
