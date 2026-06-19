import { CalendarCheck, Heart, Send, Users } from "lucide-react";
import { CategorySection } from "@/components/marketing/dashboard/CategorySection";
import { KpiCard } from "@/components/marketing/dashboard/KpiCard";
import { FollowersLineChart } from "@/components/marketing/dashboard/content/FollowersLineChart";
import { DonutChart } from "@/components/marketing/dashboard/shared/DonutChart";
import {
  getContentKpis,
  getFollowersSeries,
  getPostsByPlatform,
} from "@/server/queries/marketing/dashboard";
import { compact, deltaPct, int } from "@/lib/marketing/dashboard";
import type { DashboardPeriod } from "@/types/marketing-dashboard";

export async function ContentSection({ period }: { period: DashboardPeriod }) {
  const [{ current, previous }, followers, posts] = await Promise.all([
    getContentKpis(period),
    getFollowersSeries(period),
    getPostsByPlatform(period),
  ]);

  return (
    <CategorySection
      title="Performance de Conteúdo"
      description="Publicações, alcance e crescimento orgânico nas redes."
      href="/modulos/marketing/calendario-conteudo"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Posts publicados"
          value={int(current.posts_publicados)}
          deltaPct={deltaPct(current.posts_publicados, previous.posts_publicados)}
          icon={<Send className="h-4 w-4" />}
        />
        <KpiCard
          label="Posts agendados"
          value={int(current.posts_agendados)}
          sub="próximos"
          icon={<CalendarCheck className="h-4 w-4" />}
        />
        <KpiCard
          label="Total de seguidores"
          value={int(current.seguidores_total)}
          sub={`+${int(current.seguidores_ganhos)} no período`}
          icon={<Users className="h-4 w-4" />}
        />
        <KpiCard
          label="Engajamento médio / post"
          value={compact(current.engajamento_medio)}
          deltaPct={deltaPct(current.engajamento_medio, previous.engajamento_medio)}
          icon={<Heart className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FollowersLineChart data={followers} />
        </div>
        <DonutChart
          title="Posts por plataforma"
          data={posts.map((p) => ({ name: p.platform, value: p.count }))}
        />
      </div>
    </CategorySection>
  );
}
