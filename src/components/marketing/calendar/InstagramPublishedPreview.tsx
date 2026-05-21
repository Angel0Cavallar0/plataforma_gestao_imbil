"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InstagramCarouselChild, InstagramMediaInsightRow } from "@/types/marketing";
import { cn } from "@/lib/utils";

const ACCOUNT_LABEL = "imbil";

type Slide = {
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  type: string;
};

function isVideoType(type: string, productType: string | null) {
  const t = type.toUpperCase();
  const p = productType?.toUpperCase() ?? "";
  return t === "VIDEO" || t === "REELS" || p === "REELS" || p === "VIDEO";
}

function InstagramMediaFrame({
  slide,
  isVideo,
  permalink,
}: {
  slide: Slide;
  isVideo: boolean;
  permalink: string | null;
}) {
  const [videoFailed, setVideoFailed] = useState(false);
  const poster = slide.thumbnailUrl ?? undefined;
  const visualUrl = slide.thumbnailUrl ?? slide.mediaUrl;

  if (!visualUrl && !slide.mediaUrl) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center bg-neutral-100 text-sm text-neutral-500">
        Mídia indisponível
      </div>
    );
  }

  if (isVideo && slide.mediaUrl && !videoFailed) {
    return (
      <div className="relative aspect-[4/5] w-full bg-black">
        <video
          src={slide.mediaUrl}
          poster={poster}
          className="h-full w-full object-cover"
          controls
          playsInline
          preload="metadata"
          referrerPolicy="no-referrer"
          onError={() => setVideoFailed(true)}
        />
      </div>
    );
  }

  if (isVideo && visualUrl) {
    return (
      <div className="relative aspect-[4/5] w-full bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={visualUrl}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        {permalink ? (
          <a
            href={permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors hover:bg-black/40"
            aria-label="Reproduzir no Instagram"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <Play className="h-7 w-7 fill-black text-black pl-0.5" />
            </span>
          </a>
        ) : (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <Play className="h-7 w-7 fill-black text-black pl-0.5" />
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="aspect-[4/5] w-full bg-neutral-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={visualUrl ?? slide.mediaUrl ?? ""}
        alt=""
        className="h-full w-full object-cover"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

export function InstagramPublishedPreview({
  latest,
  carouselItems,
}: {
  latest: InstagramMediaInsightRow;
  carouselItems: InstagramCarouselChild[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const isCarousel = carouselItems.length > 0;
  const isVideo = isVideoType(latest.media_type, latest.media_product_type);

  const slides: Slide[] = isCarousel
    ? carouselItems.map((c) => ({
        mediaUrl: c.media_url,
        thumbnailUrl: c.thumbnail_url,
        type: c.media_type,
      }))
    : [
        {
          mediaUrl: latest.media_url,
          thumbnailUrl: latest.thumbnail_url,
          type: latest.media_type,
        },
      ];

  const current = slides[activeIndex] ?? slides[0];
  const slideIsVideo =
    isVideo || (current ? isVideoType(current.type, latest.media_product_type) : false);

  const caption = latest.caption ?? "";
  const lines = caption.trim().split("\n");
  const firstLine = lines[0] ?? "";
  const rest = lines.slice(1).join("\n");

  function prev() {
    setActiveIndex((i) => (i <= 0 ? slides.length - 1 : i - 1));
  }

  function next() {
    setActiveIndex((i) => (i >= slides.length - 1 ? 0 : i + 1));
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white text-black shadow-sm">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2">
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
          <div className="h-full w-full rounded-full bg-white p-[1px]">
            <div className="h-full w-full rounded-full bg-neutral-200" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{ACCOUNT_LABEL}</p>
          <p className="text-[10px] text-neutral-500">
            {latest.media_product_type === "REELS" ? "Reels" : "Publicação"}
          </p>
        </div>
      </div>

      <div className="relative">
        {current && (
          <InstagramMediaFrame
            slide={current}
            isVideo={slideIsVideo}
            permalink={latest.permalink}
          />
        )}
        {slides.length > 1 && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-white/90 shadow"
              onClick={prev}
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-white/90 shadow"
              onClick={next}
              aria-label="Próximo"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {slides.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    i === activeIndex ? "bg-primary" : "bg-white/70",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="space-y-1 px-3 py-2 text-xs">
        <div className="flex gap-3 text-neutral-800">
          <span aria-hidden>♡</span>
          <span aria-hidden>💬</span>
          <span aria-hidden>➤</span>
        </div>
        {caption ? (
          <p className="whitespace-pre-wrap break-words leading-snug">
            <span className="font-semibold">{ACCOUNT_LABEL} </span>
            {firstLine}
            {rest ? `\n${rest}` : ""}
          </p>
        ) : (
          <p className="text-neutral-400">Sem legenda</p>
        )}
      </div>
    </div>
  );
}
