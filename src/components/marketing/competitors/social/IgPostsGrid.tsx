import {
  Heart,
  MessageCircle,
  ExternalLink,
  Images,
  Film,
  Image as ImageIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState } from "../shared/EmptyState";
import { formatNumber, formatDate } from "@/lib/marketing/competitors";
import type { Competitor, IgPost } from "@/types/marketing-competitors";

function mediaIcon(type: string | null) {
  if (type === "CAROUSEL_ALBUM") return <Images className="h-3.5 w-3.5" />;
  if (type === "VIDEO") return <Film className="h-3.5 w-3.5" />;
  return <ImageIcon className="h-3.5 w-3.5" />;
}

/** Grid de posts recentes do Instagram (Seção 6). */
export function IgPostsGrid({
  posts,
  competitors,
}: {
  posts: IgPost[];
  competitors: Competitor[];
}) {
  if (!posts.length) {
    return <EmptyState message="Nenhum post coletado para esta seleção." />;
  }
  const nameById = new Map(competitors.map((c) => [c.id, c.name]));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {posts.map((p) => (
        <Card key={p.id} className="flex flex-col p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {nameById.get(p.competitor_id) ?? p.username ?? "—"}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              {mediaIcon(p.media_type)}
            </span>
          </div>
          <p className="mt-2 line-clamp-4 flex-1 text-sm">
            {p.caption?.trim() || (
              <span className="text-muted-foreground">Sem legenda</span>
            )}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" /> {formatNumber(p.like_count)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" /> {formatNumber(p.comments_count)}
            </span>
            <span className="ml-auto">{formatDate(p.published_at)}</span>
          </div>
          {p.permalink && (
            <a
              href={p.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-3 w-fit gap-1",
              )}
            >
              Ver no Instagram <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </Card>
      ))}
    </div>
  );
}
