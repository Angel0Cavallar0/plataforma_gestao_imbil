"use client";

import { useState, type ReactNode } from "react";
import {
  Bookmark,
  Eye,
  Heart,
  MessageCircle,
  MousePointerClick,
  Play,
  Share2,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PostThumbnail } from "@/components/marketing/insights/shared/PostThumbnail";
import { SocialPostDialog } from "@/components/marketing/insights/social/SocialPostDialog";
import { NETWORKS } from "@/lib/constants/marketing-insights";
import { brl, int } from "@/lib/marketing/ad-spend";
import { truncate } from "@/lib/marketing/insights";
import type { SocialPost } from "@/types/marketing-insights";

function Metric({ icon, value }: { icon: ReactNode; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
      {icon}
      {int(value)}
    </span>
  );
}

function postedAt(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Card de post orgânico (clicável → pop-up de detalhes) com selo de impulsionado. */
export function SocialPostCard({ post }: { post: SocialPost }) {
  const [open, setOpen] = useState(false);
  const net = NETWORKS[post.network];
  const isVideo = (post.media_type ?? "").toUpperCase().includes("VIDEO");

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        aria-label="Ver detalhes da publicação"
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardContent className="flex gap-3 p-3">
          <PostThumbnail
            network={post.network}
            id={post.id}
            mediaType={post.media_type}
            className="h-20 w-20"
          />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-1 text-xs font-medium">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: net.color }}
                />
                {net.name}
              </span>
              {post.media_type && (
                <span className="text-xs text-muted-foreground">{post.media_type}</span>
              )}
              {post.published_at && (
                <span className="text-xs text-muted-foreground">
                  · {postedAt(post.published_at)}
                </span>
              )}
              {post.is_boosted && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <Sparkles className="h-3 w-3" />
                  Impulsionado
                  {post.ad_spend != null && post.ad_spend > 0
                    ? ` · ${brl(post.ad_spend)}`
                    : ""}
                </span>
              )}
            </div>

            {post.caption && (
              <p className="line-clamp-2 text-xs text-foreground/80">
                {truncate(post.caption, 140)}
              </p>
            )}

            <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
              <Metric icon={<Eye className="h-3 w-3" />} value={post.reach} />
              {post.network === "instagram" ? (
                <>
                  {isVideo && post.plays > 0 && (
                    <Metric icon={<Play className="h-3 w-3" />} value={post.plays} />
                  )}
                  <Metric icon={<Heart className="h-3 w-3" />} value={post.likes} />
                  <Metric
                    icon={<MessageCircle className="h-3 w-3" />}
                    value={post.comments}
                  />
                  <Metric icon={<Bookmark className="h-3 w-3" />} value={post.saves} />
                  <Metric icon={<Share2 className="h-3 w-3" />} value={post.shares} />
                </>
              ) : (
                <>
                  <Metric icon={<Heart className="h-3 w-3" />} value={post.reactions} />
                  <Metric
                    icon={<MessageCircle className="h-3 w-3" />}
                    value={post.comments}
                  />
                  <Metric icon={<Share2 className="h-3 w-3" />} value={post.shares} />
                  <Metric
                    icon={<MousePointerClick className="h-3 w-3" />}
                    value={post.clicks}
                  />
                </>
              )}
            </div>

            {post.permalink && (
              <a
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Ver post <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <SocialPostDialog post={post} open={open} onOpenChange={setOpen} />
    </>
  );
}
