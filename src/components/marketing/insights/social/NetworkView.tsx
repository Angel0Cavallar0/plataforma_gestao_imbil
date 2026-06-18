import { InsightKpiCard } from "@/components/marketing/insights/shared/InsightKpiCard";
import { DeltaBadge } from "@/components/marketing/insights/shared/DeltaBadge";
import { FollowersTrendChart } from "@/components/marketing/insights/social/FollowersTrendChart";
import { SocialPostsGrid } from "@/components/marketing/insights/social/SocialPostsGrid";
import { DemographicsPanel } from "@/components/marketing/insights/social/DemographicsPanel";
import { NETWORKS } from "@/lib/constants/marketing-insights";
import { int } from "@/lib/marketing/ad-spend";
import type {
  FollowersHistoryRow,
  NetworkOverview,
  SocialPost,
} from "@/types/marketing-insights";

/** Visão detalhada de uma rede específica (Seção 3.3 — "Por rede"). */
export function NetworkView({
  overview,
  followersRows,
  posts,
  instagramExtra,
}: {
  overview: NetworkOverview;
  followersRows: FollowersHistoryRow[];
  posts: SocialPost[];
  instagramExtra?: { profile_views: number; follower_demographics: unknown | null };
}) {
  const net = overview.network;
  const meta = NETWORKS[net];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InsightKpiCard
          color={meta.color}
          label="Seguidores"
          value={overview.followers != null ? int(overview.followers) : "—"}
          delta={<DeltaBadge value={overview.followers_delta} mode="int" />}
        />
        <InsightKpiCard label="Alcance" value={int(overview.reach)} />
        <InsightKpiCard label="Impressões" value={int(overview.impressions)} />
        <InsightKpiCard
          label="Interações"
          value={int(overview.engagement)}
          sub="curtidas + comentários + compart."
        />
        {net === "instagram" && instagramExtra && (
          <InsightKpiCard
            label="Visitas ao perfil"
            value={int(instagramExtra.profile_views)}
          />
        )}
        <InsightKpiCard label="Comentários" value={int(overview.comments)} />
        {net === "instagram" && (
          <InsightKpiCard label="Salvamentos" value={int(overview.shares)} />
        )}
      </div>

      <FollowersTrendChart rows={followersRows} networks={[net]} />

      {net === "linkedin" ? (
        <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
          Posts orgânicos do LinkedIn não são detalhados nesta visão.
        </p>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Posts do período</h2>
          <SocialPostsGrid posts={posts} />
        </div>
      )}

      {net === "instagram" && instagramExtra?.follower_demographics != null && (
        <DemographicsPanel demographics={instagramExtra.follower_demographics} />
      )}
    </div>
  );
}
