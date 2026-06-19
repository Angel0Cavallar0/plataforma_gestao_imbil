"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltipContent } from "@/components/marketing/ad-spend/shared/ChartTooltipContent";
import { YOUTUBE_COLOR } from "@/lib/constants/marketing-insights";
import { compactInt, fmtShortDate } from "@/lib/marketing/insights";
import type { YouTubeStats } from "@/types/marketing-insights";

/** Evolução de inscritos do canal (Seção 5.1). */
export function SubscribersTrendChart({ history }: { history: YouTubeStats[] }) {
  const data = history.map((h) => ({
    snapshot_date: h.snapshot_date,
    Inscritos: h.subscriber_count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Evolução de inscritos</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {data.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sem histórico de inscritos.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="snapshot_date"
                tickFormatter={fmtShortDate}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => compactInt(Number(v))}
                domain={["auto", "auto"]}
                width={48}
              />
              <Tooltip
                content={
                  <ChartTooltipContent
                    formatLabel={(l) => fmtShortDate(String(l))}
                    formatValue={(v) => v.toLocaleString("pt-BR")}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="Inscritos"
                stroke={YOUTUBE_COLOR}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
