import { Eye, ThumbsUp, MessageCircle, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState } from "../shared/EmptyState";
import { formatCompact, formatDate } from "@/lib/marketing/competitors";
import type { Competitor, YoutubeVideo } from "@/types/marketing-competitors";

/** Grid de vídeos recentes do YouTube (Seção 7). */
export function YtVideosGrid({
  videos,
  competitors,
}: {
  videos: YoutubeVideo[];
  competitors: Competitor[];
}) {
  if (!videos.length) {
    return <EmptyState message="Nenhum vídeo coletado para esta seleção." />;
  }
  const nameById = new Map(competitors.map((c) => [c.id, c.name]));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((v) => (
        <Card key={v.id} className="flex flex-col overflow-hidden">
          {v.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={v.thumbnail_url}
              alt={v.title ?? "Thumbnail do vídeo"}
              className="aspect-video w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="aspect-video w-full bg-muted" />
          )}
          <div className="flex flex-1 flex-col gap-2 p-3">
            <span className="text-xs font-medium text-muted-foreground">
              {nameById.get(v.competitor_id) ?? "—"}
            </span>
            <p className="line-clamp-2 flex-1 text-sm font-medium">{v.title ?? "—"}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> {formatCompact(v.view_count)}
              </span>
              <span className="inline-flex items-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5" /> {formatCompact(v.like_count)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" /> {formatCompact(v.comment_count)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{formatDate(v.published_at)}</span>
              <a
                href={`https://www.youtube.com/watch?v=${v.video_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-1",
                )}
              >
                Assistir no YouTube <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
