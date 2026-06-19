import { InsightKpiCard } from "@/components/marketing/insights/shared/InsightKpiCard";
import { DeltaBadge } from "@/components/marketing/insights/shared/DeltaBadge";
import { NETWORKS } from "@/lib/constants/marketing-insights";
import { int } from "@/lib/marketing/ad-spend";
import type { NetworkOverview } from "@/types/marketing-insights";

/** 3 cards de seguidores por rede com Δ no período (Seção 3.3). */
export function NetworkKpiCards({ overview }: { overview: NetworkOverview[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {overview.map((o) => (
        <InsightKpiCard
          key={o.network}
          color={NETWORKS[o.network].color}
          label={`Seguidores · ${NETWORKS[o.network].name}`}
          value={o.followers != null ? int(o.followers) : "—"}
          delta={<DeltaBadge value={o.followers_delta} mode="int" />}
          sub={`${int(o.reach)} de alcance · ${o.boosted_posts} ${
            o.boosted_posts === 1 ? "post impulsionado" : "posts impulsionados"
          }`}
        />
      ))}
    </div>
  );
}
