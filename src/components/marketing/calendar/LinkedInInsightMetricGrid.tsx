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
import { chartYDomain } from "@/lib/marketing/facebook-insights";
import {
  chartDataForMetric,
  displayMetricValue,
  formatMetricValue,
  LI_CORE_METRICS,
  LI_METRIC_COLORS,
  LI_METRIC_LABELS,
  LI_VIDEO_METRICS,
  type LiMetricKey,
} from "@/lib/marketing/linkedin-insights";
import type { LinkedInPostInsightRow } from "@/types/marketing";

const CHART_BOX = "h-36 w-full min-h-36";

function MetricCardWithChart({
  metricKey,
  history,
}: {
  metricKey: LiMetricKey;
  history: LinkedInPostInsightRow[];
}) {
  const label = LI_METRIC_LABELS[metricKey];
  const color = LI_METRIC_COLORS[metricKey];
  const current = displayMetricValue(history, metricKey);
  const chartData = chartDataForMetric(history, metricKey);
  const yDomain = chartYDomain(chartData.map((d) => d.value));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <p className="text-2xl font-semibold tabular-nums">
          {formatMetricValue(metricKey, current)}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {chartData.length > 0 ? (
          <div className={CHART_BOX}>
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
                <YAxis tick={{ fontSize: 10 }} width={44} domain={yDomain} />
                <Tooltip
                  formatter={(v) => formatMetricValue(metricKey, Number(v))}
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

export function LinkedInInsightMetricGrid({
  history,
  showVideo,
}: {
  history: LinkedInPostInsightRow[];
  showVideo: boolean;
}) {
  const metrics: LiMetricKey[] = [
    ...LI_CORE_METRICS,
    "engagement",
    ...(showVideo ? LI_VIDEO_METRICS : []),
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((key) => (
        <MetricCardWithChart key={key} metricKey={key} history={history} />
      ))}
    </div>
  );
}
