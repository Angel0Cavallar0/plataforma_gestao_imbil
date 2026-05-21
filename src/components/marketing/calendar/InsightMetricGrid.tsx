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
import {
  chartDataForMetric,
  metricValue,
  ORGANIC_METRIC_LABELS,
  PAID_METRIC_LABELS,
  type OrganicMetricKey,
  type PaidMetricKey,
} from "@/lib/marketing/instagram-insights";
import type { InstagramMediaInsightRow } from "@/types/marketing";

const METRIC_COLORS: Record<string, string> = {
  reach: "#3b82f6",
  impressions: "#ec1c23",
  likes: "#e4405f",
  comments: "#a855f7",
  saves: "#f59e0b",
  shares: "#22c55e",
  plays: "#06b6d4",
  ad_spend: "#f97316",
  ad_impressions: "#6366f1",
  ad_reach: "#14b8a6",
};

function formatValue(key: string, value: number): string {
  if (key === "ad_spend") {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return value.toLocaleString("pt-BR");
}

function MetricCardWithChart({
  label,
  valueKey,
  history,
}: {
  label: string;
  valueKey: OrganicMetricKey | PaidMetricKey;
  history: InstagramMediaInsightRow[];
}) {
  const current = metricValue(history, valueKey);
  const chartData = chartDataForMetric(history, valueKey);
  const color = METRIC_COLORS[valueKey] ?? "#ec1c23";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <p className="text-2xl font-semibold tabular-nums">
          {formatValue(valueKey, current)}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {chartData.length > 0 ? (
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10 }} width={40} />
                <Tooltip
                  formatter={(v) => formatValue(valueKey, Number(v))}
                  labelFormatter={(l) => String(l)}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={label}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 2, fill: color }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Sem dados no período
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function InsightMetricGrid({
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
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {organicKeys.map((key) => (
          <MetricCardWithChart
            key={key}
            label={ORGANIC_METRIC_LABELS[key]}
            valueKey={key}
            history={history}
          />
        ))}
      </div>
      {showPaid && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Mídia paga (boost)</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {paidKeys.map((key) => (
              <MetricCardWithChart
                key={key}
                label={PAID_METRIC_LABELS[key]}
                valueKey={key}
                history={history}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
