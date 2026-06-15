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
import { AD_PLATFORMS } from "@/lib/constants/marketing-ads";
import { int } from "@/lib/marketing/ad-spend";
import {
  chartCursorFill,
  chartTooltipProps,
} from "@/components/marketing/ad-spend/shared/chart-theme";
import type { FunnelRow } from "@/types/marketing-ads";

const STAGES = [
  { key: "impressions", label: "Impressões" },
  { key: "clicks", label: "Cliques" },
  { key: "landing_page_views", label: "Landing page views" },
  { key: "conversions", label: "Conversões" },
] as const;

/**
 * Funil comparativo entre canais (Seção 7). Barras horizontais decrescentes,
 * uma série por plataforma. Onde a etapa não existe (LPV de Google/LinkedIn),
 * a série pula o valor (null) e a nota de rodapé explica.
 */
export function ConversionFunnelChart({ rows }: { rows: FunnelRow[] }) {
  const present = new Set(rows.map((r) => r.platform_slug));
  const lpvMissing = rows
    .filter((r) => r.landing_page_views == null)
    .map((r) => AD_PLATFORMS[r.platform_slug].name);

  const data = STAGES.map((stage) => {
    const point: Record<string, number | string | null> = { stage: stage.label };
    for (const r of rows) {
      const value = r[stage.key as keyof FunnelRow];
      point[r.platform_slug] = value == null ? null : Number(value);
    }
    return point;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Funil de conversão — comparativo</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {rows.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sem dados no período.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="stage"
                width={120}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                {...chartTooltipProps}
                cursor={chartCursorFill}
                formatter={(value) => int(Number(value))}
              />
              <Legend />
              {[...present].map((slug) => (
                <Bar
                  key={slug}
                  dataKey={slug}
                  name={AD_PLATFORMS[slug].name}
                  fill={AD_PLATFORMS[slug].color}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
      {lpvMissing.length > 0 && (
        <p className="px-6 pb-4 text-xs text-muted-foreground">
          * Landing page views disponível apenas no Meta. Sem dado de LPV para:{" "}
          {lpvMissing.join(", ")}.
        </p>
      )}
    </Card>
  );
}
