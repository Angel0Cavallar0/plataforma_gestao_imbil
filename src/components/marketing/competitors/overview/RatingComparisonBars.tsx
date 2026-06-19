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
import { EmptyState } from "../shared/EmptyState";
import { competitorColor } from "@/lib/marketing/competitors";
import type { CompetitorOverview } from "@/types/marketing-competitors";

/** Rating Google por concorrente (nº de reviews como contexto) — Seção 5.3. */
export function RatingComparisonBars({ rows }: { rows: CompetitorOverview[] }) {
  const data = rows
    .filter((r) => r.google_rating != null)
    .map((r, i) => ({
      name: r.name,
      rating: Number(r.google_rating),
      reviews: r.google_reviews_count ?? 0,
      color: competitorColor(r.name, i),
    }))
    .sort((a, b) => b.rating - a.rating);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rating no Google</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {data.length === 0 ? (
          <EmptyState message="Sem ratings coletados." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 0, right: 8 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="opacity-30"
                vertical={false}
              />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                content={
                  <ChartTooltipContent
                    formatValue={(v) =>
                      v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
                    }
                  />
                }
              />
              <Bar dataKey="rating" name="Rating" radius={[4, 4, 0, 0]}>
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
