"use client";

import { useMemo, useState } from "react";
import {
  filterInsightHistory,
  hasBoostedHistory,
  ORGANIC_METRICS,
  PAID_METRICS,
  type InsightPeriod,
} from "@/lib/marketing/instagram-insights";
import type { InstagramMediaInsightRow } from "@/types/marketing";
import { InsightPeriodFilter } from "@/components/marketing/calendar/InsightPeriodFilter";
import { InsightMetricGrid } from "@/components/marketing/calendar/InsightMetricGrid";

export function InstagramInsightsPanel({
  fullHistory,
}: {
  fullHistory: InstagramMediaInsightRow[];
}) {
  const [period, setPeriod] = useState<InsightPeriod>("total");
  const filtered = useMemo(
    () => filterInsightHistory(fullHistory, period),
    [fullHistory, period],
  );
  const showPaid = hasBoostedHistory(fullHistory);

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Insights</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Histórico diário de métricas da publicação.
        </p>
      </div>
      <InsightPeriodFilter value={period} onChange={setPeriod} />
      <InsightMetricGrid
        history={filtered}
        organicKeys={ORGANIC_METRICS}
        paidKeys={PAID_METRICS}
        showPaid={showPaid}
      />
    </div>
  );
}
