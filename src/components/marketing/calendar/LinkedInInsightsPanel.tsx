"use client";

import { useMemo, useState } from "react";
import {
  filterInsightHistory,
  isVideoPostType,
  type InsightPeriod,
} from "@/lib/marketing/linkedin-insights";
import type { LinkedInPostInsightRow } from "@/types/marketing";
import { InsightPeriodFilter } from "@/components/marketing/calendar/InsightPeriodFilter";
import { LinkedInInsightMetricGrid } from "@/components/marketing/calendar/LinkedInInsightMetricGrid";

export function LinkedInInsightsPanel({
  fullHistory,
  postType,
}: {
  fullHistory: LinkedInPostInsightRow[];
  postType: string | null;
}) {
  const [period, setPeriod] = useState<InsightPeriod>("total");
  const filtered = useMemo(
    () => filterInsightHistory(fullHistory, period),
    [fullHistory, period],
  );
  const showVideo = isVideoPostType(postType);

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Insights</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Histórico diário de métricas da publicação no LinkedIn.
        </p>
      </div>
      <InsightPeriodFilter value={period} onChange={setPeriod} />
      <LinkedInInsightMetricGrid history={filtered} showVideo={showVideo} />
    </div>
  );
}
