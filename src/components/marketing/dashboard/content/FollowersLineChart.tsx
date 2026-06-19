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
import { CHANNEL_COLORS, compact, longDate, shortDate } from "@/lib/marketing/dashboard";
import type { FollowersSeriesPoint } from "@/types/marketing-dashboard";

const SERIES = [
  { key: "instagram", label: "Instagram", color: CHANNEL_COLORS.instagram },
  { key: "facebook", label: "Facebook", color: CHANNEL_COLORS.facebook },
  { key: "linkedin", label: "LinkedIn", color: CHANNEL_COLORS.linkedin },
] as const;

export function FollowersLineChart({ data }: { data: FollowersSeriesPoint[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Evolução de seguidores</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {data.length === 0 ? (
          <p className="grid h-full place-items-center text-sm text-muted-foreground">
            Sem histórico no período.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
              <Legend />
              {SERIES.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
