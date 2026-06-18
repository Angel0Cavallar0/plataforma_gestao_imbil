import { NetworkKpiCards } from "@/components/marketing/insights/social/NetworkKpiCards";
import { FollowersTrendChart } from "@/components/marketing/insights/social/FollowersTrendChart";
import { EngagementByNetworkChart } from "@/components/marketing/insights/social/EngagementByNetworkChart";
import { SocialPostsGrid } from "@/components/marketing/insights/social/SocialPostsGrid";
import type {
  FollowersHistoryRow,
  NetworkOverview,
  SocialPost,
} from "@/types/marketing-insights";

/** Visão geral das redes sociais (Seção 3.3). */
export function SocialOverview({
  overview,
  followersRows,
  posts,
}: {
  overview: NetworkOverview[];
  followersRows: FollowersHistoryRow[];
  posts: SocialPost[];
}) {
  return (
    <div className="space-y-6">
      <NetworkKpiCards overview={overview} />
      <FollowersTrendChart rows={followersRows} />
      <EngagementByNetworkChart overview={overview} />
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Posts recentes</h2>
        <SocialPostsGrid posts={posts} limit={8} />
      </div>
    </div>
  );
}
