"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InstagramCarouselChild, InstagramMediaInsightRow } from "@/types/marketing";
import { SocialProfileAvatar } from "@/components/marketing/calendar/SocialProfileAvatar";
import { cn } from "@/lib/utils";

const ACCOUNT_LABEL = "imbil";

function instagramMediaProxyUrl(mediaId: string, childId?: string) {
  const base = `/api/marketing/instagram-media/${encodeURIComponent(mediaId)}`;
  if (childId) return `${base}?child=${encodeURIComponent(childId)}`;
  return base;
}

function isVideoType(type: string, productType: string | null) {
  const t = type.toUpperCase();
  const p = productType?.toUpperCase() ?? "";
  return t === "VIDEO" || t === "REELS" || p === "REELS" || p === "VIDEO";
}

function isCarouselType(type: string, productType: string | null) {
  const t = type.toUpperCase();
  const p = productType?.toUpperCase() ?? "";
  return t === "CAROUSEL" || t === "CAROUSEL_ALBUM" || p === "CAROUSEL";
}

function InstagramVideoFrame({
  mediaId,
  childId,
  posterUrl,
}: {
  mediaId: string;
  childId?: string;
  posterUrl: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const src = instagramMediaProxyUrl(mediaId, childId);

  if (failed) {
    return (
      <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 bg-neutral-900 px-4 text-center text-sm text-neutral-300">
        {posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterUrl}
            alt=""
            className="max-h-48 w-full object-contain opacity-80"
          />
        ) : null}
        <p>Não foi possível reproduzir o vídeo. A URL pode ter expirado na origem.</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/5] w-full bg-black">
      <video
        key={src}
        src={src}
        poster={posterUrl ?? undefined}
        className="h-full w-full object-cover"
        controls
        playsInline
        preload="auto"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function InstagramImageFrame({
  mediaId,
  childId,
}: {
  mediaId: string;
  childId?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = instagramMediaProxyUrl(mediaId, childId);

  if (failed) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center bg-neutral-100 text-sm text-neutral-500">
        Imagem indisponível
      </div>
    );
  }

  return (
    <div className="aspect-[4/5] w-full bg-neutral-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function InstagramPublishedPreview({
  mediaId,
  latest,
  carouselItems,
  captionOverride,
  mediaSubLabel,
}: {
  mediaId: string;
  latest: InstagramMediaInsightRow;
  carouselItems: InstagramCarouselChild[];
  /** Legenda exibida no rodapé (ex.: texto do Facebook em cross-post). */
  captionOverride?: string | null;
  mediaSubLabel?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasCarouselChildren = carouselItems.length > 0;
  const isCarousel =
    hasCarouselChildren || isCarouselType(latest.media_type, latest.media_product_type);
  const isVideo = isVideoType(latest.media_type, latest.media_product_type);

  const caption =
    captionOverride !== undefined && captionOverride !== null
      ? captionOverride
      : (latest.caption ?? "");
  const lines = caption.trim().split("\n");
  const firstLine = lines[0] ?? "";
  const rest = lines.slice(1).join("\n");

  function prev() {
    if (!hasCarouselChildren) return;
    setActiveIndex((i) => (i <= 0 ? carouselItems.length - 1 : i - 1));
  }

  function next() {
    if (!hasCarouselChildren) return;
    setActiveIndex((i) => (i >= carouselItems.length - 1 ? 0 : i + 1));
  }

  function renderMedia() {
    if (hasCarouselChildren) {
      const child = carouselItems[activeIndex];
      if (!child) return null;
      const childId = child.child_media_id;
      const childIsVideo = isVideoType(child.media_type, latest.media_product_type);
      if (childIsVideo) {
        return (
          <InstagramVideoFrame
            mediaId={mediaId}
            childId={childId}
            posterUrl={child.thumbnail_url}
          />
        );
      }
      return <InstagramImageFrame mediaId={mediaId} childId={childId} />;
    }

    if (isVideo) {
      return <InstagramVideoFrame mediaId={mediaId} posterUrl={latest.thumbnail_url} />;
    }

    return <InstagramImageFrame mediaId={mediaId} />;
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white text-black shadow-sm">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2">
        <SocialProfileAvatar />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{ACCOUNT_LABEL}</p>
          <p className="text-[10px] text-neutral-500">
            {mediaSubLabel ??
              (isCarousel
                ? "Carrossel"
                : latest.media_product_type === "REELS"
                  ? "Reels"
                  : "Publicação")}
          </p>
        </div>
      </div>

      <div className="relative">
        {renderMedia()}
        {hasCarouselChildren && carouselItems.length > 1 && (
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
              {carouselItems.map((_, i) => (
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
