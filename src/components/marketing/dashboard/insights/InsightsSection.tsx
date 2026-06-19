import { FileText, Globe, MessageSquare, Star, Video } from "lucide-react";
import { CategorySection } from "@/components/marketing/dashboard/CategorySection";
import { KpiCard } from "@/components/marketing/dashboard/KpiCard";
import { DonutChart } from "@/components/marketing/dashboard/shared/DonutChart";
import { SiteSessionsLine } from "@/components/marketing/dashboard/insights/SiteSessionsLine";
import { ReportHighlightsList } from "@/components/marketing/dashboard/insights/ReportHighlightsList";
import {
  getInsightsKpis,
  getReportHighlights,
  getSiteSessions,
  getTrafficSources,
} from "@/server/queries/marketing/dashboard";
import { deltaPct, int, longDate } from "@/lib/marketing/dashboard";
import type { DashboardPeriod } from "@/types/marketing-dashboard";

export async function InsightsSection({ period }: { period: DashboardPeriod }) {
  const [{ current, previous }, sessions, traffic, highlights] = await Promise.all([
    getInsightsKpis(period),
    getSiteSessions(period),
    getTrafficSources(period),
    getReportHighlights(),
  ]);

  const rel = current.ultimo_relatorio;

  return (
    <CategorySection
      title="Insights"
      description="Site, YouTube, menções à marca e relatórios de IA."
      href="/modulos/marketing/insights"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Sessões no site"
          value={int(current.sessions)}
          deltaPct={deltaPct(current.sessions, previous.sessions)}
          icon={<Globe className="h-4 w-4" />}
        />
        <KpiCard
          label="Inscritos no YouTube"
          value={int(current.youtube_subscribers)}
          icon={<Video className="h-4 w-4" />}
        />
        <KpiCard
          label="Menções à marca"
          value={int(current.brand_mentions)}
          deltaPct={deltaPct(current.brand_mentions, previous.brand_mentions)}
          icon={<MessageSquare className="h-4 w-4" />}
        />
        <KpiCard
          label="Média de estrelas"
          value={current.avg_rating != null ? `${current.avg_rating} ★` : "—"}
          icon={<Star className="h-4 w-4" />}
        />
        <KpiCard
          label="Último relatório"
          value={rel ? longDate(rel.gerado_em.slice(0, 10)) : "—"}
          sub={rel?.tipo ?? "nenhum gerado"}
          icon={<FileText className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SiteSessionsLine data={sessions} />
        </div>
        <DonutChart title="Fontes de tráfego" data={traffic} />
      </div>

      <ReportHighlightsList data={highlights} />
    </CategorySection>
  );
}
