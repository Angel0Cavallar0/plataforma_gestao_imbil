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
import { channelColor, compact } from "@/lib/marketing/dashboard";
import type { ConversionFunnelRow } from "@/types/marketing-dashboard";

const STAGES = [
  { key: "impressions", label: "Impressões" },
  { key: "clicks", label: "Cliques" },
  { key: "conversions", label: "Conversões" },
] as const;

/** Funil impressões → cliques → conversões, comparando canais (barras agrupadas). */
export function ConversionFunnel({ data }: { data: ConversionFunnelRow[] }) {
  // Pivota: cada estágio é uma linha; cada canal vira uma série/coluna.
  const chartData = STAGES.map((stage) => {
    const row: Record<string, string | number> = { stage: stage.label };
    for (const ch of data) row[ch.platform] = ch[stage.key];
    return row;
  });
  const channels = data.map((d) => d.platform);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Funil de conversão por canal</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {channels.length === 0 ? (
          <p className="grid h-full place-items-center text-sm text-muted-foreground">
            Sem dados de mídia paga no período.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={compact} tick={{ fontSize: 11 }} width={44} />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                content={
                  <ChartTooltipContent formatValue={(v) => v.toLocaleString("pt-BR")} />
                }
              />
              <Legend />
              {channels.map((ch, i) => (
                <Bar
                  key={ch}
                  dataKey={ch}
                  name={ch}
                  fill={channelColor(ch, i)}
                  radius={3}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
