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
import {
  chartDataFromHistory,
  ORGANIC_METRIC_LABELS,
  PAID_METRIC_LABELS,
  type OrganicMetricKey,
  type PaidMetricKey,
} from "@/lib/marketing/instagram-insights";
import type { InstagramMediaInsightRow } from "@/types/marketing";

const CHART_COLORS = [
  "#ec1c23",
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#f59e0b",
  "#06b6d4",
  "#e4405f",
];

function MultiLineChart({
  title,
  data,
  keys,
  labels,
}: {
  title: string;
  data: Record<string, string | number>[];
  keys: readonly string[];
  labels: Record<string, string | undefined>;
}) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sem dados no período selecionado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={48} />
              <Tooltip />
              <Legend />
              {keys.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={labels[key] ?? key}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function InsightCharts({
  history,
  organicKeys,
  paidKeys,
  showPaid,
}: {
  history: InstagramMediaInsightRow[];
  organicKeys: readonly OrganicMetricKey[];
  paidKeys: readonly PaidMetricKey[];
  showPaid: boolean;
}) {
  const organicData = chartDataFromHistory(history, organicKeys);
  const paidData = chartDataFromHistory(history, paidKeys);

  return (
    <div className="space-y-4">
      <MultiLineChart
        title="Desempenho orgânico"
        data={organicData}
        keys={organicKeys}
        labels={ORGANIC_METRIC_LABELS}
      />
      {showPaid && (
        <MultiLineChart
          title="Desempenho — mídia paga"
          data={paidData}
          keys={paidKeys}
          labels={PAID_METRIC_LABELS}
        />
      )}
    </div>
  );
}
