"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { SocialOverview } from "@/components/marketing/insights/social/SocialOverview";
import { NetworkView } from "@/components/marketing/insights/social/NetworkView";
import { NETWORK_SLUGS, NETWORKS } from "@/lib/constants/marketing-insights";
import type {
  FollowersHistoryRow,
  NetworkOverview,
  SocialNetwork,
  SocialPost,
} from "@/types/marketing-insights";

type SubTab = "overview" | SocialNetwork;

/**
 * Tabs internas da aba Redes Sociais (Visão geral | Instagram | Facebook |
 * LinkedIn). Todos os dados são pré-carregados no servidor; a troca de aba é
 * client-side (sem refetch).
 */
export function SocialNetworkTabs({
  overview,
  followersRows,
  posts,
  instagramExtra,
}: {
  overview: NetworkOverview[];
  followersRows: FollowersHistoryRow[];
  posts: SocialPost[];
  instagramExtra: { profile_views: number; follower_demographics: unknown | null };
}) {
  const [tab, setTab] = useState<SubTab>("overview");

  const tabs: { key: SubTab; label: string }[] = [
    { key: "overview", label: "Visão geral" },
    ...NETWORK_SLUGS.map((n) => ({ key: n, label: NETWORKS[n].name })),
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              buttonVariants({
                variant: tab === t.key ? "secondary" : "ghost",
                size: "sm",
              }),
              "h-8",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <SocialOverview overview={overview} followersRows={followersRows} posts={posts} />
      ) : (
        <NetworkView
          overview={overview.find((o) => o.network === tab)!}
          followersRows={followersRows}
          posts={posts.filter((p) => p.network === tab)}
          instagramExtra={tab === "instagram" ? instagramExtra : undefined}
        />
      )}
    </div>
  );
}
