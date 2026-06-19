import { SocialPostCard } from "@/components/marketing/insights/social/SocialPostCard";
import type { SocialPost } from "@/types/marketing-insights";

/** Grid de posts recentes (com selo de impulsionado). */
export function SocialPostsGrid({
  posts,
  limit,
}: {
  posts: SocialPost[];
  limit?: number;
}) {
  const shown = limit ? posts.slice(0, limit) : posts;

  if (shown.length === 0) {
    return (
      <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
        Nenhum post no período selecionado.
      </p>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {shown.map((p) => (
        <SocialPostCard key={`${p.network}:${p.id}`} post={p} />
      ))}
    </div>
  );
}
