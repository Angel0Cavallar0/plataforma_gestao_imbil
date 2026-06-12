"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventRoiRow } from "@/types/marketing-events";

function cpl(row: EventRoiRow): number | null {
  if (!row.investment || !row.leads_total) return null;
  return Math.round((row.investment / row.leads_total) * 100) / 100;
}

export function RoiCharts({ rows }: { rows: EventRoiRow[] }) {
  const label = (r: EventRoiRow) => `${r.name}${r.edition ? ` ${r.edition}` : ""}`;

  const barData = rows.map((r) => ({
    name: label(r),
    investimento: r.investment ?? 0,
    leads: r.leads_total,
  }));

  const scatterData = rows
    .filter((r) => cpl(r) !== null && r.leads_total > 0)
    .map((r) => ({
      name: label(r),
      cpl: cpl(r),
      taxaQualificacao: Math.round((r.leads_qualified / r.leads_total) * 100),
    }));

  // Evolução do CPL por edição (eventos com mesmo nome ao longo dos anos)
  const recurring = new Map<string, { edition: string; cpl: number }[]>();
  for (const r of rows) {
    const value = cpl(r);
    if (value === null) continue;
    const list = recurring.get(r.name) ?? [];
    list.push({ edition: r.edition ?? (r.starts_on ?? "").slice(0, 4), cpl: value });
    recurring.set(r.name, list);
  }
  const trendSeries = [...recurring.entries()].filter(([, list]) => list.length > 1);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Investimento × Leads por evento</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="investimento"
                name="Investimento (R$)"
                fill="#0ea5e9"
              />
              <Bar yAxisId="right" dataKey="leads" name="Leads" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            CPL × Taxa de qualificação (caro e ruim vs barato e bom)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="cpl"
                name="CPL (R$)"
                type="number"
                tick={{ fontSize: 11 }}
                label={{
                  value: "CPL (R$)",
                  position: "insideBottom",
                  offset: -2,
                  fontSize: 11,
                }}
              />
              <YAxis
                dataKey="taxaQualificacao"
                name="Qualificação (%)"
                type="number"
                unit="%"
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                formatter={(value, name) => [value, name]}
                labelFormatter={() => ""}
              />
              <Scatter data={scatterData} name="Eventos" fill="#8b5cf6" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm">Evolução do CPL por edição</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {trendSeries.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Disponível quando o mesmo evento tiver mais de uma edição realizada.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="edition"
                  type="category"
                  allowDuplicatedCategory={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {trendSeries.map(([name, list], i) => (
                  <Line
                    key={name}
                    data={list}
                    dataKey="cpl"
                    name={name}
                    stroke={
                      ["#0ea5e9", "#22c55e", "#8b5cf6", "#f59e0b", "#ef4444"][i % 5]
                    }
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
