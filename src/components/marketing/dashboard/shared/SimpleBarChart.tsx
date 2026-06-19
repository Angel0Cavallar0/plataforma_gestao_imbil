"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltipContent } from "@/components/marketing/ad-spend/shared/ChartTooltipContent";
import { channelColor, compact } from "@/lib/marketing/dashboard";

export type BarDatum = { name: string; value: number; color?: string };

/** Barras de série única (vertical ou horizontal), uma cor por categoria. */
export function SimpleBarChart({
  title,
  data,
  horizontal = false,
  formatValue = (v) => v.toLocaleString("pt-BR"),
  colorFor,
  emptyMessage = "Sem dados no período.",
  height = "h-72",
}: {
  title: string;
  data: BarDatum[];
  horizontal?: boolean;
  formatValue?: (v: number) => string;
  colorFor?: (name: string, index: number) => string;
  emptyMessage?: string;
  height?: string;
}) {
  const color = colorFor ?? channelColor;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className={height}>
        {data.length === 0 ? (
          <p className="grid h-full place-items-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout={horizontal ? "vertical" : "horizontal"}
              margin={{ top: 8, right: 12, bottom: 0, left: horizontal ? 8 : 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              {horizontal ? (
                <>
                  <XAxis type="number" tickFormatter={compact} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={110}
                  />
                </>
              ) : (
                <>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={compact} tick={{ fontSize: 11 }} width={44} />
                </>
              )}
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                content={<ChartTooltipContent formatValue={formatValue} />}
              />
              <Bar dataKey="value" name="Valor" radius={4}>
                {data.map((d, i) => (
                  <Cell key={d.name} fill={d.color ?? color(d.name, i)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
