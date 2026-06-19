"use client";

import { useState } from "react";
import { ExternalLink, Eye, Heart, MessageCircle, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { int } from "@/lib/marketing/ad-spend";
import { truncate } from "@/lib/marketing/insights";
import type { YouTubeVideo } from "@/types/marketing-insights";

type SortKey = "published_at" | "view_count" | "like_count" | "comment_count";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "published_at", label: "Mais recentes" },
  { key: "view_count", label: "Mais vistos" },
  { key: "like_count", label: "Mais curtidos" },
  { key: "comment_count", label: "Mais comentados" },
];

function videoUrl(id: string) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
}

/** Thumbnail do vídeo via proxy interno (CSP-safe); placeholder em caso de falha. */
function VideoThumb({ videoId }: { videoId: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-md border bg-muted">
        <Play className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className="aspect-video overflow-hidden rounded-md border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/marketing/youtube-thumb/${encodeURIComponent(videoId)}`}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

/** Grid de vídeos do canal, ordenável (Seção 5.1). */
export function YouTubeVideosGrid({ videos }: { videos: YouTubeVideo[] }) {
  const [sort, setSort] = useState<SortKey>("published_at");

  const sorted = [...videos].sort((a, b) => {
    if (sort === "published_at") {
      return (b.published_at ?? "").localeCompare(a.published_at ?? "");
    }
    return (b[sort] ?? 0) - (a[sort] ?? 0);
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Vídeos</h2>
        <div className="flex flex-wrap gap-1">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSort(s.key)}
              className={cn(
                buttonVariants({
                  variant: sort === s.key ? "secondary" : "ghost",
                  size: "sm",
                }),
                "h-7 px-2 text-xs",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
          Nenhum vídeo coletado.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((v) => (
            <Card key={v.video_id}>
              <CardContent className="space-y-2 p-3">
                <VideoThumb videoId={v.video_id} />
                <p className="line-clamp-2 text-sm font-medium">
                  {truncate(v.title, 90) || "Sem título"}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {int(v.view_count)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {int(v.like_count)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {int(v.comment_count)}
                  </span>
                </div>
                <a
                  href={videoUrl(v.video_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Assistir no YouTube <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
