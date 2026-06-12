"use client";

import { useMemo, useState } from "react";
import {
  filterInsightHistory,
  hasBoostedHistory,
  isVideoPostType,
  type InsightPeriod,
} from "@/lib/marketing/facebook-insights";
import type { FacebookPostInsightRow } from "@/types/marketing";
import { InsightPeriodFilter } from "@/components/marketing/calendar/InsightPeriodFilter";
import { FacebookInsightMetricGrid } from "@/components/marketing/calendar/FacebookInsightMetricGrid";

export function FacebookInsightsPanel({
  fullHistory,
  postType,
}: {
  fullHistory: FacebookPostInsightRow[];
  postType: string | null;
}) {
  const [period, setPeriod] = useState<InsightPeriod>("total");
  const filtered = useMemo(
    () => filterInsightHistory(fullHistory, period),
    [fullHistory, period],
  );
  const showPaid = hasBoostedHistory(fullHistory);
  const showVideo = isVideoPostType(postType);

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Insights</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Histórico diário de métricas da publicação no Facebook.
        </p>
      </div>
      <InsightPeriodFilter value={period} onChange={setPeriod} />
      <FacebookInsightMetricGrid
        history={filtered}
        showPaid={showPaid}
        showVideo={showVideo}
      />
    </div>
  );
}
