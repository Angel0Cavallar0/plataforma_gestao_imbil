import { CompetitorsTabs } from "@/components/marketing/competitors/CompetitorsTabs";
import { CompetitorSelector } from "@/components/marketing/competitors/CompetitorSelector";
import { IgFollowersCards } from "@/components/marketing/competitors/social/IgFollowersCards";
import { IgPostsGrid } from "@/components/marketing/competitors/social/IgPostsGrid";
import { CompetitorBars } from "@/components/marketing/competitors/shared/CompetitorBars";
import { firstParam } from "@/lib/marketing/competitors";
import {
  getCompetitors,
  getCompetitorsOverview,
  getIgPosts,
  getImbilEngagement,
  getImbilIgFollowers,
} from "@/server/queries/marketing/competitors";
import { IMBIL_NAME } from "@/types/marketing-competitors";

export default async function ConcorrentesRedesSociaisPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const competitorId = firstParam(sp.competitor);

  const [competitors, overview, posts, allPosts, imbilFollowers, imbilEngagement] =
    await Promise.all([
      getCompetitors(),
      getCompetitorsOverview(),
      getIgPosts(competitorId, 60),
      getIgPosts(undefined, 500),
      getImbilIgFollowers(),
      getImbilEngagement(),
    ]);

  // Engajamento médio por concorrente (likes + comentários).
  const nameById = new Map(competitors.map((c) => [c.id, c.name]));
  const agg = new Map<string, { total: number; n: number }>();
  for (const p of allPosts) {
    const a = agg.get(p.competitor_id) ?? { total: 0, n: 0 };
    a.total += (p.like_count ?? 0) + (p.comments_count ?? 0);
    a.n += 1;
    agg.set(p.competitor_id, a);
  }
  const engagement = Array.from(agg.entries()).map(([id, a]) => ({
    name: nameById.get(id) ?? "—",
    value: a.n ? Math.round(a.total / a.n) : 0,
  }));
  // IMBIL: engajamento médio diário (total_interactions) ao lado dos concorrentes.
  if (imbilEngagement != null) {
    engagement.push({ name: IMBIL_NAME, value: Math.round(imbilEngagement) });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Concorrentes — Redes Sociais</h1>
        <p className="text-sm text-muted-foreground">
          Instagram: seguidores, posts e engajamento.
        </p>
      </div>

      <CompetitorsTabs />
      <CompetitorSelector competitors={competitors} />

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Seguidores no Instagram</h2>
        <IgFollowersCards rows={overview} imbilFollowers={imbilFollowers} />
      </div>

      <CompetitorBars
        title="Engajamento médio por post (likes + comentários)"
        seriesName="Engajamento médio"
        data={engagement}
        emptyMessage="Sem posts coletados."
        format="number"
      />

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Posts recentes</h2>
        <IgPostsGrid posts={posts} competitors={competitors} />
      </div>
    </div>
  );
}
