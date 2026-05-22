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
  FB_CORE_METRICS,
  FB_METRIC_LABELS,
  FB_PAID_METRICS,
  FB_REACTION_METRICS,
  FB_UNIFIED_METRIC_PAIRS,
  FB_VIDEO_METRICS,
  formatMetricValue,
  metricValue,
  ORGANIC_LINE_COLOR,
  PAID_LINE_COLOR,
  type FbCoreMetricKey,
  type FbMetricKey,
  type FbPaidMetricKey,
  type FbReactionMetricKey,
  type FbUnifiedOrganicKey,
  type FbUnifiedPaidKey,
  type FbVideoMetricKey,
} from "@/lib/marketing/facebook-insights";
import type { FacebookPostInsightRow } from "@/types/marketing";

const METRIC_COLORS: Partial<Record<FbMetricKey, string>> = {
  engaged_users: "#1877F2",
  reactions_total: "#e4405f",
  comments: "#a855f7",
  shares: "#22c55e",
  clicks: "#f59e0b",
  ad_spend: "#f97316",
};

function UnifiedMetricCard({
  title,
  organicKey,
  paidKey,
  history,
  showPaid,
}: {
  title: string;
  organicKey: FbUnifiedOrganicKey;
  paidKey: FbUnifiedPaidKey;
  history: FacebookPostInsightRow[];
  showPaid: boolean;
}) {
  const organicCurrent = metricValue(history, organicKey);
  const paidCurrent = metricValue(history, paidKey);
  const chartData = chartDataUnifiedOrganicPaid(history, organicKey, paidKey);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="space-y-0.5">
          <p className="text-xl font-semibold tabular-nums">
            <span className="text-xs font-normal text-muted-foreground">Orgânico: </span>
            {formatMetricValue(organicKey, organicCurrent)}
          </p>
          {showPaid && (
            <p className="text-xl font-semibold tabular-nums">
              <span className="text-xs font-normal text-muted-foreground">Pago: </span>
              {formatMetricValue(paidKey, paidCurrent)}
            </p>
          )}
        </div>
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
                  formatter={(v, name) => [
                    formatMetricValue(name === "paid" ? paidKey : organicKey, Number(v)),
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
  valueKey: FbCoreMetricKey | FbReactionMetricKey | FbVideoMetricKey | FbPaidMetricKey;
  history: FacebookPostInsightRow[];
}) {
  const current = metricValue(history, valueKey);
  const chartData = chartDataForMetric(history, valueKey);
  const color = METRIC_COLORS[valueKey] ?? "#1877F2";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <p className="text-2xl font-semibold tabular-nums">
          {formatMetricValue(valueKey, current)}
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
                  formatter={(v) => formatMetricValue(valueKey, Number(v))}
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

export function FacebookInsightMetricGrid({
  history,
  showPaid,
  showVideo,
}: {
  history: FacebookPostInsightRow[];
  showPaid: boolean;
  showVideo: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {FB_UNIFIED_METRIC_PAIRS.map((pair) => (
          <UnifiedMetricCard
            key={pair.title}
            title={pair.title}
            organicKey={pair.organicKey}
            paidKey={pair.paidKey}
            history={history}
            showPaid={showPaid}
          />
        ))}
        {FB_CORE_METRICS.map((key) => (
          <MetricCardWithChart
            key={key}
            label={FB_METRIC_LABELS[key]}
            valueKey={key}
            history={history}
          />
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Reações</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FB_REACTION_METRICS.map((key) => (
            <MetricCardWithChart
              key={key}
              label={FB_METRIC_LABELS[key]}
              valueKey={key}
              history={history}
            />
          ))}
        </div>
      </div>

      {showVideo && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Vídeo</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {FB_VIDEO_METRICS.map((key) => (
              <MetricCardWithChart
                key={key}
                label={FB_METRIC_LABELS[key]}
                valueKey={key}
                history={history}
              />
            ))}
          </div>
        </div>
      )}

      {showPaid && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Mídia paga (boost)</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {FB_PAID_METRICS.map((key) => (
              <MetricCardWithChart
                key={key}
                label={FB_METRIC_LABELS[key]}
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
