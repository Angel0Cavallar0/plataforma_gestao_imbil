import { CompetitorsTabs } from "@/components/marketing/competitors/CompetitorsTabs";
import { CompetitorSelector } from "@/components/marketing/competitors/CompetitorSelector";
import { IgFollowersTrend } from "@/components/marketing/competitors/social/IgFollowersTrend";
import { IgPostsGrid } from "@/components/marketing/competitors/social/IgPostsGrid";
import { CompetitorBars } from "@/components/marketing/competitors/shared/CompetitorBars";
import { firstParam, formatNumber } from "@/lib/marketing/competitors";
import {
  getCompetitors,
  getIgFollowersTrend,
  getIgPosts,
} from "@/server/queries/marketing/competitors";

export default async function ConcorrentesRedesSociaisPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const competitorId = firstParam(sp.competitor);

  const [competitors, followers, posts, allPosts] = await Promise.all([
    getCompetitors(),
    getIgFollowersTrend(competitorId),
    getIgPosts(competitorId, 60),
    getIgPosts(undefined, 500),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Concorrentes — Redes Sociais</h1>
        <p className="text-sm text-muted-foreground">
          Instagram: evolução de seguidores, posts e engajamento.
        </p>
      </div>

      <CompetitorsTabs />
      <CompetitorSelector competitors={competitors} />

      <IgFollowersTrend points={followers} />

      <CompetitorBars
        title="Engajamento médio por post (likes + comentários)"
        seriesName="Engajamento médio"
        data={engagement}
        emptyMessage="Sem posts coletados."
        formatValue={(v) => formatNumber(v)}
      />

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Posts recentes</h2>
        <IgPostsGrid posts={posts} competitors={competitors} />
      </div>
    </div>
  );
}
