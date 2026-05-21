"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  metricDelta,
  ORGANIC_METRIC_LABELS,
  PAID_METRIC_LABELS,
  type OrganicMetricKey,
  type PaidMetricKey,
} from "@/lib/marketing/instagram-insights";
import type { InstagramMediaInsightRow } from "@/types/marketing";

function formatValue(key: string, value: number): string {
  if (key === "ad_spend") {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return value.toLocaleString("pt-BR");
}

function MetricCard({
  label,
  current,
  delta,
  valueKey,
}: {
  label: string;
  current: number;
  delta: number | null;
  valueKey: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">
          {formatValue(valueKey, current)}
        </p>
        {delta !== null && (
          <p
            className={
              delta >= 0
                ? "mt-1 text-xs text-emerald-600 dark:text-emerald-400"
                : "mt-1 text-xs text-red-600 dark:text-red-400"
            }
          >
            {delta >= 0 ? "+" : ""}
            {formatValue(valueKey, delta)} vs. período anterior
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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {organicKeys.map((key) => {
          const { current, delta } = metricDelta(history, key);
          return (
            <MetricCard
              key={key}
              label={ORGANIC_METRIC_LABELS[key]}
              current={current}
              delta={delta}
              valueKey={key}
            />
          );
        })}
      </div>
      {showPaid && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Mídia paga (boost)</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {paidKeys.map((key) => {
              const { current, delta } = metricDelta(history, key);
              return (
                <MetricCard
                  key={key}
                  label={PAID_METRIC_LABELS[key]}
                  current={current}
                  delta={delta}
                  valueKey={key}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
