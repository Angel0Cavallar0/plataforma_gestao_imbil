"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltipContent } from "@/components/marketing/ad-spend/shared/ChartTooltipContent";
import { compact, longDate, shortDate } from "@/lib/marketing/dashboard";
import type { SiteSessionsPoint } from "@/types/marketing-dashboard";

export function SiteSessionsLine({ data }: { data: SiteSessionsPoint[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Sessões no site</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {data.length === 0 ? (
          <p className="grid h-full place-items-center text-sm text-muted-foreground">
            Sem dados de analytics no período.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="sessionsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-1, #2563eb)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-1, #2563eb)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={compact} tick={{ fontSize: 11 }} width={44} />
              <Tooltip
                content={
                  <ChartTooltipContent
                    formatLabel={(l) => longDate(String(l))}
                    formatValue={(v) => v.toLocaleString("pt-BR")}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="sessions"
                name="Sessões"
                stroke="var(--chart-1, #2563eb)"
                strokeWidth={2}
                fill="url(#sessionsFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
