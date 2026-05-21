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
  chartDataForMetric,
  chartDataUnifiedOrganicPaid,
  metricValue,
  ORGANIC_LINE_COLOR,
  ORGANIC_METRIC_LABELS,
  ORGANIC_METRICS_SIMPLE,
  PAID_LINE_COLOR,
  PAID_METRIC_LABELS,
  UNIFIED_METRIC_PAIRS,
  type OrganicMetricKey,
  type PaidMetricKey,
} from "@/lib/marketing/instagram-insights";
import type { InstagramMediaInsightRow } from "@/types/marketing";

const METRIC_COLORS: Record<string, string> = {
  likes: "#e4405f",
  comments: "#a855f7",
  saves: "#f59e0b",
  shares: "#22c55e",
  plays: "#06b6d4",
  ad_spend: "#f97316",
};

function formatValue(key: string, value: number): string {
  if (key === "ad_spend") {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return value.toLocaleString("pt-BR");
}

function UnifiedMetricCard({
  title,
  organicKey,
  paidKey,
  history,
  showPaid,
}: {
  title: string;
  organicKey: "reach" | "impressions";
  paidKey: "ad_reach" | "ad_impressions";
  history: InstagramMediaInsightRow[];
  showPaid: boolean;
}) {
  const organicCurrent = metricValue(history, organicKey);
  const paidCurrent = metricValue(history, paidKey);
  const chartData = chartDataUnifiedOrganicPaid(history, organicKey, paidKey);

  return (
    <Card className="sm:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="text-2xl font-semibold tabular-nums">
            <span className="text-base font-normal text-muted-foreground">
              Orgânico:{" "}
            </span>
            {formatValue(organicKey, organicCurrent)}
          </p>
          {showPaid && (
            <p className="text-2xl font-semibold tabular-nums">
              <span className="text-base font-normal text-muted-foreground">Pago: </span>
              {formatValue(paidKey, paidCurrent)}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {chartData.length > 0 ? (
          <div className="h-40 w-full">
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
                  formatter={(v, name) => [
                    formatValue(name === "paid" ? paidKey : organicKey, Number(v)),
                    name === "paid" ? "Pago" : "Orgânico",
                  ]}
                  labelFormatter={(l) => String(l)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="organic"
                  name="Orgânico"
                  stroke={ORGANIC_LINE_COLOR}
                  strokeWidth={2}
                  dot={{ r: 2, fill: ORGANIC_LINE_COLOR }}
                />
                {showPaid && (
                  <Line
                    type="monotone"
                    dataKey="paid"
                    name="Pago"
                    stroke={PAID_LINE_COLOR}
                    strokeWidth={2}
                    dot={{ r: 2, fill: PAID_LINE_COLOR }}
                    strokeDasharray="4 4"
                  />
                )}
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
  showPaid,
}: {
  history: InstagramMediaInsightRow[];
  showPaid: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {UNIFIED_METRIC_PAIRS.map((pair) => (
          <UnifiedMetricCard
            key={pair.title}
            title={pair.title}
            organicKey={pair.organicKey}
            paidKey={pair.paidKey}
            history={history}
            showPaid={showPaid}
          />
        ))}
        {ORGANIC_METRICS_SIMPLE.map((key) => (
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
            <MetricCardWithChart
              label={PAID_METRIC_LABELS.ad_spend}
              valueKey="ad_spend"
              history={history}
            />
          </div>
        </div>
      )}
    </div>
  );
}
