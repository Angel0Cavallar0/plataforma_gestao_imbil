"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
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
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChartTooltipContent } from "@/components/marketing/ad-spend/shared/ChartTooltipContent";
import { NETWORKS, NETWORK_SLUGS } from "@/lib/constants/marketing-insights";
import { buildFollowersChart, compactInt } from "@/lib/marketing/insights";
import type {
  FollowersHistoryRow,
  Granularity,
  SocialNetwork,
} from "@/types/marketing-insights";

const GRANS: { key: Granularity; label: string }[] = [
  { key: "day", label: "Dia" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mês" },
];

/**
 * Histórico de seguidores (Seção 3.4-A): total cumulativo em linha + ganho por
 * período em barras, com toggle de granularidade (agregação client-side).
 */
export function FollowersTrendChart({
  rows,
  networks = NETWORK_SLUGS,
}: {
  rows: FollowersHistoryRow[];
  networks?: readonly SocialNetwork[];
}) {
  const [gran, setGran] = useState<Granularity>("day");
  const data = buildFollowersChart(rows, gran);
  const hasData = data.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Seguidores — total e ganho por período</CardTitle>
        <div className="flex gap-1">
          {GRANS.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setGran(g.key)}
              className={cn(
                buttonVariants({
                  variant: gran === g.key ? "secondary" : "ghost",
                  size: "sm",
                }),
                "h-7 px-2 text-xs",
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData ? (
          <p className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Sem dados no período.
          </p>
        ) : (
          <>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Total de seguidores
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => compactInt(Number(v))}
                      domain={["auto", "auto"]}
                      width={48}
                    />
                    <Tooltip
                      content={
                        <ChartTooltipContent
                          formatValue={(v) => v.toLocaleString("pt-BR")}
                        />
                      }
                    />
                    <Legend />
                    {networks.map((net) => (
                      <Line
                        key={net}
                        type="monotone"
                        dataKey={`${net}_total`}
                        name={NETWORKS[net].name}
                        stroke={NETWORKS[net].color}
                        strokeWidth={2}
                        connectNulls
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Ganho de seguidores no período
              </p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => compactInt(Number(v))}
                      width={48}
                    />
                    <Tooltip
                      content={
                        <ChartTooltipContent
                          formatValue={(v) => v.toLocaleString("pt-BR")}
                        />
                      }
                    />
                    <Legend />
                    {networks.map((net) => (
                      <Bar
                        key={net}
                        dataKey={`${net}_gain`}
                        name={NETWORKS[net].name}
                        fill={NETWORKS[net].color}
                        radius={[2, 2, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
