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
import { compactInt, fmtShortDate } from "@/lib/marketing/insights";
import type { SiteDailyRow } from "@/types/marketing-insights";

/** Sessões e usuários ao longo do tempo (Seção 5.2). */
export function SessionsTrendChart({ daily }: { daily: SiteDailyRow[] }) {
  const data = daily.map((r) => ({
    data_referencia: r.data_referencia,
    Sessões: r.sessions ?? 0,
    Usuários: r.total_users ?? 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Sessões e usuários</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
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
                tickFormatter={fmtShortDate}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => compactInt(Number(v))}
                width={44}
              />
              <Tooltip
                content={
                  <ChartTooltipContent
                    formatLabel={(l) => fmtShortDate(String(l))}
                    formatValue={(v) => v.toLocaleString("pt-BR")}
                  />
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Sessões"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Usuários"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
