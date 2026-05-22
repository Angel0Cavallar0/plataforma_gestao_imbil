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
  chartDataEngagementRate,
  chartDataForMetric,
  chartDataReactionsMultiLine,
  chartDataUnifiedOrganicPaid,
  chartDataVideoViewsMultiLine,
  chartYDomain,
  engagementRateFromHistory,
  FB_CORE_METRICS,
  FB_METRIC_LABELS,
  FB_PAID_METRICS,
  FB_REACTION_COLORS,
  FB_TOP_REACH_PAIR,
  FB_VIDEO_OTHER_METRICS,
  FB_VIDEO_VIEW_COLORS,
  FB_VIDEO_VIEW_METRICS,
  formatEngagementRate,
  formatMetricValue,
  metricValue,
  reactionMetricsWithData,
  ORGANIC_LINE_COLOR,
  PAID_LINE_COLOR,
  ENGAGEMENT_RATE_COLOR,
  type FbCoreMetricKey,
  type FbMetricKey,
  type FbPaidMetricKey,
  type FbReactionMetricKey,
  type FbTopMetricKey,
  type FbUnifiedOrganicKey,
  type FbUnifiedPaidKey,
  type FbVideoMetricKey,
} from "@/lib/marketing/facebook-insights";
import type { FacebookPostInsightRow } from "@/types/marketing";

const CHART_BOX = "h-36 w-full min-h-36";

const METRIC_COLORS: Partial<Record<FbMetricKey, string>> = {
  engaged_users: "#1877F2",
  reactions_total: "#e4405f",
  comments: "#a855f7",
  shares: "#22c55e",
  ad_spend: "#f97316",
  video_avg_watch_time: "#06b6d4",
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
  const yDomain = chartYDomain(
    chartData.flatMap((d) => [d.organic, ...(showPaid ? [d.paid] : [])]),
  );

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
                <YAxis tick={{ fontSize: 10 }} width={40} domain={yDomain} />
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

function EngagementRateCard({ history }: { history: FacebookPostInsightRow[] }) {
  const current = engagementRateFromHistory(history);
  const chartData = chartDataEngagementRate(history);
  const yDomain = chartYDomain(chartData.map((d) => d.value));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Engajamento do post
        </CardTitle>
        <p className="text-2xl font-semibold tabular-nums">
          {formatEngagementRate(current)}
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
                <YAxis
                  tick={{ fontSize: 10 }}
                  width={44}
                  domain={yDomain}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(v) => formatEngagementRate(Number(v))}
                  labelFormatter={(l) => String(l)}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Engajamento"
                  stroke={ENGAGEMENT_RATE_COLOR}
                  strokeWidth={2}
                  dot={{ r: 2, fill: ENGAGEMENT_RATE_COLOR }}
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

function MetricCardWithChart({
  label,
  valueKey,
  history,
  className,
}: {
  label: string;
  valueKey:
    | FbCoreMetricKey
    | FbTopMetricKey
    | FbReactionMetricKey
    | FbVideoMetricKey
    | FbPaidMetricKey;
  history: FacebookPostInsightRow[];
  className?: string;
}) {
  const current = metricValue(history, valueKey);
  const chartData = chartDataForMetric(history, valueKey);
  const color = METRIC_COLORS[valueKey] ?? "#1877F2";
  const yDomain = chartYDomain(chartData.map((d) => d.value));

  return (
    <Card className={className}>
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
                <YAxis tick={{ fontSize: 10 }} width={40} domain={yDomain} />
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

function ReactionsTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string | number; value?: number; color?: string }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => Number(p.value) > 0);
  if (rows.length === 0) return null;

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-popover-foreground">{String(label)}</p>
      <ul className="space-y-0.5">
        {rows.map((p) => {
          const key = String(p.dataKey) as FbReactionMetricKey;
          return (
            <li key={key} className="tabular-nums" style={{ color: p.color }}>
              {FB_METRIC_LABELS[key]} : {Number(p.value).toLocaleString("pt-BR")}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ReactionsMultiLineCard({ history }: { history: FacebookPostInsightRow[] }) {
  const chartData = chartDataReactionsMultiLine(history);
  const activeMetrics = reactionMetricsWithData(history);
  const yDomain = chartYDomain(
    chartData.flatMap((d) => activeMetrics.map((key) => Number(d[key] ?? 0))),
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Reações por tipo
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {chartData.length > 0 && activeMetrics.length > 0 ? (
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
                <YAxis tick={{ fontSize: 10 }} width={40} domain={yDomain} />
                <Tooltip content={<ReactionsTooltipContent />} />
                <Legend />
                {activeMetrics.map((key) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={FB_METRIC_LABELS[key]}
                    stroke={FB_REACTION_COLORS[key]}
                    strokeWidth={2}
                    dot={{ r: 2, fill: FB_REACTION_COLORS[key] }}
                  />
                ))}
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

function VideoViewsMultiLineCard({ history }: { history: FacebookPostInsightRow[] }) {
  const chartData = chartDataVideoViewsMultiLine(history);
  const yDomain = chartYDomain(
    chartData.flatMap((d) => FB_VIDEO_VIEW_METRICS.map((key) => Number(d[key] ?? 0))),
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Visualizações de vídeo
        </CardTitle>
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
                <YAxis tick={{ fontSize: 10 }} width={40} domain={yDomain} />
                <Tooltip
                  formatter={(v, name) => [
                    Number(v).toLocaleString("pt-BR"),
                    FB_METRIC_LABELS[name as FbVideoMetricKey] ?? String(name),
                  ]}
                  labelFormatter={(l) => String(l)}
                />
                <Legend />
                {FB_VIDEO_VIEW_METRICS.map((key) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={FB_METRIC_LABELS[key]}
                    stroke={FB_VIDEO_VIEW_COLORS[key]}
                    strokeWidth={2}
                    dot={{ r: 2, fill: FB_VIDEO_VIEW_COLORS[key] }}
                  />
                ))}
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <UnifiedMetricCard
          title={FB_TOP_REACH_PAIR.title}
          organicKey={FB_TOP_REACH_PAIR.organicKey}
          paidKey={FB_TOP_REACH_PAIR.paidKey}
          history={history}
          showPaid={showPaid}
        />
        <MetricCardWithChart
          label={FB_METRIC_LABELS.engaged_users}
          valueKey="engaged_users"
          history={history}
        />
        <EngagementRateCard history={history} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        <ReactionsMultiLineCard history={history} />
      </div>

      {showVideo && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Vídeo</h3>
          <div className="grid items-stretch gap-3 md:grid-cols-2">
            <VideoViewsMultiLineCard history={history} />
            {FB_VIDEO_OTHER_METRICS.map((key) => (
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
