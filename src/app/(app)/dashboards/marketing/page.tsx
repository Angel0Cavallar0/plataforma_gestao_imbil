import { Suspense } from "react";
import { requireAuth } from "@/lib/auth/session";
import { hasMinRole } from "@/lib/auth/permissions";
import { parseDashboardPeriod, longDate } from "@/lib/marketing/dashboard";
import { DashboardPeriodFilter } from "@/components/marketing/dashboard/DashboardPeriodFilter";
import { SectionSkeleton } from "@/components/marketing/dashboard/SectionSkeleton";
import { ContentSection } from "@/components/marketing/dashboard/content/ContentSection";
import { PaidSection } from "@/components/marketing/dashboard/paid/PaidSection";
import { InvestmentSection } from "@/components/marketing/dashboard/investment/InvestmentSection";
import { EventsSection } from "@/components/marketing/dashboard/events/EventsSection";
import { InsightsSection } from "@/components/marketing/dashboard/insights/InsightsSection";
import { CompetitorsSection } from "@/components/marketing/dashboard/competitors/CompetitorsSection";
import { AlertsSection } from "@/components/marketing/dashboard/alerts/AlertsSection";

export const metadata = { title: "Dashboard de Marketing" };

export default async function MarketingDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [sp, session] = await Promise.all([searchParams, requireAuth()]);
  const period = parseDashboardPeriod(sp);
  const canManageRules = hasMinRole(session.profile, "gestor");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard de Marketing</h1>
          <p className="text-sm text-muted-foreground">
            Visão executiva consolidada · {longDate(period.from)} – {longDate(period.to)}
            <span className="text-muted-foreground/70">
              {" "}
              (vs {longDate(period.prevFrom)} – {longDate(period.prevTo)})
            </span>
          </p>
        </div>
        <DashboardPeriodFilter period={period} />
      </div>

      {/* Cada categoria carrega de forma independente (skeleton individual). */}
      <Suspense fallback={<SectionSkeleton kpis={4} />}>
        <ContentSection period={period} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton kpis={5} />}>
        <PaidSection period={period} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton kpis={4} />}>
        <InvestmentSection period={period} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton kpis={4} />}>
        <EventsSection period={period} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton kpis={5} />}>
        <InsightsSection period={period} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton kpis={5} />}>
        <CompetitorsSection period={period} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton kpis={3} />}>
        <AlertsSection period={period} canManage={canManageRules} />
      </Suspense>
    </div>
  );
}
