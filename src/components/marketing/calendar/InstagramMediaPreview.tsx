"use client";

import { useState } from "react";
import type { InstagramCarouselChild, InstagramMediaInsightRow } from "@/types/marketing";
import { cn } from "@/lib/utils";

export function InstagramMediaPreview({
  latest,
  carouselItems,
}: {
  latest: InstagramMediaInsightRow;
  carouselItems: InstagramCarouselChild[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const isCarousel = carouselItems.length > 0;
  const isVideo =
    latest.media_type === "VIDEO" ||
    latest.media_product_type === "REELS" ||
    latest.media_type === "REELS";

  const slides = isCarousel
    ? carouselItems.map((c) => ({
        url: c.media_url ?? c.thumbnail_url,
        thumb: c.thumbnail_url,
        type: c.media_type,
      }))
    : [
        {
          url: latest.media_url ?? latest.thumbnail_url,
          thumb: latest.thumbnail_url,
          type: latest.media_type,
        },
      ];

  const current = slides[activeIndex] ?? slides[0];
  const showVideo = isVideo || current?.type === "VIDEO" || current?.type === "REELS";

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border bg-muted/20">
        {current?.url ? (
          showVideo ? (
            <video
              src={current.url}
              poster={current.thumb ?? undefined}
              className="max-h-96 w-full object-contain"
              controls
              playsInline
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.url} alt="" className="max-h-96 w-full object-contain" />
          )
        ) : (
          <div className="flex aspect-square items-center justify-center text-sm text-muted-foreground">
            Mídia indisponível
          </div>
        )}
      </div>
      {isCarousel && carouselItems.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {carouselItems.map((child, i) => (
            <button
              key={child.child_media_id}
              type="button"
              className={cn(
                "h-14 w-14 shrink-0 overflow-hidden rounded border-2",
                i === activeIndex ? "border-primary" : "border-transparent opacity-70",
              )}
              onClick={() => setActiveIndex(i)}
            >
              {child.thumbnail_url || child.media_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={child.thumbnail_url ?? child.media_url ?? ""}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full items-center justify-center text-xs">?</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
