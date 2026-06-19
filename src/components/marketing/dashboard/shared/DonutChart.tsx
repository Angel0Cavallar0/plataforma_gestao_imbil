"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltipContent } from "@/components/marketing/ad-spend/shared/ChartTooltipContent";
import { channelColor } from "@/lib/marketing/dashboard";

type Slice = { name: string; value: number };

/** Donut genérico (composição, posts por plataforma, fontes de tráfego). */
export function DonutChart({
  title,
  data,
  formatValue = (v) => v.toLocaleString("pt-BR"),
  colorFor,
  emptyMessage = "Sem dados no período.",
}: {
  title: string;
  data: Slice[];
  formatValue?: (v: number) => string;
  colorFor?: (name: string, index: number) => string;
  emptyMessage?: string;
}) {
  const color = colorFor ?? channelColor;
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {data.length === 0 || total === 0 ? (
          <p className="grid h-full place-items-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={2}
              >
                {data.map((d, i) => (
                  <Cell key={d.name} fill={color(d.name, i)} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent formatValue={formatValue} />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
