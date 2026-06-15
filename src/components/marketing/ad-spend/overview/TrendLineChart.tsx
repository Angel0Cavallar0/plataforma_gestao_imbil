"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { AD_PLATFORMS, AD_PLATFORM_SLUGS } from "@/lib/constants/marketing-ads";
import { chartTooltipProps } from "@/components/marketing/ad-spend/shared/chart-theme";
import type { TrendMetric, TrendPoint } from "@/types/marketing-ads";

const METRICS: { key: TrendMetric; label: string }[] = [
  { key: "cpc", label: "CPC" },
  { key: "cpm", label: "CPM" },
  { key: "ctr", label: "CTR" },
];

function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

/** Linha de tendência de CPC/CPM/CTR por plataforma no período (Seção 7.3). */
export function TrendLineChart({
  series,
}: {
  series: Record<TrendMetric, TrendPoint[]>;
}) {
  const [metric, setMetric] = useState<TrendMetric>("cpc");
  const data = series[metric];

  const presentPlatforms = AD_PLATFORM_SLUGS.filter((slug) =>
    data.some((point) => point[slug] != null),
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Tendência ({metric.toUpperCase()})</CardTitle>
        <div className="flex gap-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMetric(m.key)}
              className={cn(
                buttonVariants({
                  variant: metric === m.key ? "secondary" : "ghost",
                  size: "sm",
                }),
                "h-7 px-2 text-xs",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="h-72">
        {data.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sem dados no período.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="data_referencia"
                tickFormatter={fmtDate}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                {...chartTooltipProps}
                labelFormatter={(label) => fmtDate(String(label))}
              />
              <Legend />
              {presentPlatforms.map((slug) => (
                <Line
                  key={slug}
                  type="monotone"
                  dataKey={slug}
                  name={AD_PLATFORMS[slug].name}
                  stroke={AD_PLATFORMS[slug].color}
                  strokeWidth={2}
                  connectNulls
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
