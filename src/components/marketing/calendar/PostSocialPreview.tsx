"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CONTENT_TYPE_LABELS } from "@/lib/constants/marketing";
import type { ContentType } from "@/types/marketing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SocialProfileAvatar } from "@/components/marketing/calendar/SocialProfileAvatar";

export type PreviewPlatform = {
  slug: string;
  name: string;
};

export type PreviewMediaItem = {
  url: string;
  mimeType?: string;
};

type Props = {
  platforms: PreviewPlatform[];
  caption: string;
  mediaPreviewUrl: string | null;
  mediaMimeType?: string;
  mediaItems?: PreviewMediaItem[];
  contentType: ContentType;
  accountLabel?: string;
};

function MediaBlock({
  url,
  mimeType,
  contentType,
}: {
  url: string | null;
  mimeType?: string;
  contentType: ContentType;
}) {
  const isVideo =
    mimeType?.startsWith("video/") || contentType === "video" || contentType === "reels";

  if (!url) {
    return (
      <div className="flex aspect-square w-full items-center justify-center bg-muted text-xs text-muted-foreground">
        {CONTENT_TYPE_LABELS[contentType]}
        <span className="ml-1">— adicione mídia</span>
      </div>
    );
  }

  if (isVideo) {
    return (
      <video
        src={url}
        className="aspect-square w-full object-cover"
        controls
        muted
        playsInline
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="aspect-square w-full object-cover" />
  );
}

function MediaCarouselBlock({
  items,
  contentType,
}: {
  items: PreviewMediaItem[];
  contentType: ContentType;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = Math.min(activeIndex, Math.max(0, items.length - 1));
  const current = items[safeIndex];

  if (!items.length) {
    return <MediaBlock url={null} contentType={contentType} />;
  }

  if (items.length === 1) {
    return (
      <MediaBlock
        url={items[0]!.url}
        mimeType={items[0]!.mimeType}
        contentType={contentType}
      />
    );
  }

  return (
    <div className="relative">
      <MediaBlock
        url={current?.url ?? null}
        mimeType={current?.mimeType}
        contentType={contentType}
      />
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute left-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-white/90 shadow"
        aria-label="Slide anterior"
        onClick={() => setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-white/90 shadow"
        aria-label="Próximo slide"
        onClick={() => setActiveIndex((i) => (i >= items.length - 1 ? 0 : i + 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
        {items.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              i === safeIndex ? "bg-primary" : "bg-white/70",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function resolveMedia(
  contentType: ContentType,
  mediaPreviewUrl: string | null,
  mediaMimeType: string | undefined,
  mediaItems?: PreviewMediaItem[],
) {
  const isCarousel = contentType === "carrossel" && (mediaItems?.length ?? 0) > 0;
  if (isCarousel) {
    return <MediaCarouselBlock items={mediaItems!} contentType={contentType} />;
  }
  return (
    <MediaBlock
      url={mediaPreviewUrl}
      mimeType={mediaMimeType}
      contentType={contentType}
    />
  );
}

function InstagramPreview({
  caption,
  mediaPreviewUrl,
  mediaMimeType,
  mediaItems,
  contentType,
  accountLabel,
}: Omit<Props, "platforms">) {
  const lines = caption.trim().split("\n");
  const firstLine = lines[0] ?? "";
  const rest = lines.slice(1).join("\n");

  return (
    <div className="overflow-hidden rounded-xl border bg-white text-black shadow-sm">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <SocialProfileAvatar />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{accountLabel ?? "imbil"}</p>
          <p className="text-[10px] text-neutral-500">
            {contentType === "carrossel" ? "Carrossel" : "Instagram"}
          </p>
        </div>
      </div>
      {resolveMedia(contentType, mediaPreviewUrl, mediaMimeType, mediaItems)}
      <div className="space-y-1 px-3 py-2 text-xs">
        <div className="flex gap-3 text-neutral-800">
          <span aria-hidden>♡</span>
          <span aria-hidden>💬</span>
          <span aria-hidden>➤</span>
        </div>
        {caption ? (
          <p className="whitespace-pre-wrap break-words leading-snug">
            <span className="font-semibold">{accountLabel ?? "imbil"} </span>
            {firstLine}
            {rest ? `\n${rest}` : ""}
          </p>
        ) : (
          <p className="text-neutral-400">Legenda aparecerá aqui…</p>
        )}
      </div>
    </div>
  );
}

function FacebookPreview({
  caption,
  mediaPreviewUrl,
  mediaMimeType,
  mediaItems,
  contentType,
  accountLabel,
}: Omit<Props, "platforms">) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white text-black shadow-sm">
      <div className="flex items-center gap-2 border-b bg-[#1877F2]/10 px-3 py-2">
        <SocialProfileAvatar size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-[#1877F2]">
            {accountLabel ?? "Imbil"}
          </p>
          <p className="text-[10px] text-neutral-500">Agora · 🌐</p>
        </div>
      </div>
      <div className="space-y-2 px-3 py-2">
        {caption ? (
          <p className="whitespace-pre-wrap break-words text-xs leading-snug">
            {caption}
          </p>
        ) : (
          <p className="text-xs text-neutral-400">Texto da publicação…</p>
        )}
      </div>
      {resolveMedia(contentType, mediaPreviewUrl, mediaMimeType, mediaItems)}
    </div>
  );
}

function PlatformPreviewCard({
  platform,
  ...props
}: Props & { platform: PreviewPlatform }) {
  return platform.slug === "instagram" ? (
    <InstagramPreview {...props} />
  ) : (
    <FacebookPreview {...props} />
  );
}

export function PostSocialPreview({
  platforms,
  caption,
  mediaPreviewUrl,
  mediaMimeType,
  mediaItems,
  contentType,
  accountLabel,
}: Props) {
  const [slide, setSlide] = useState(0);
  const carousel = platforms.length > 1;
  const activeSlide = platforms.length === 0 ? 0 : Math.min(slide, platforms.length - 1);

  if (!platforms.length) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Selecione ao menos uma rede social para ver a prévia.
      </p>
    );
  }

  const shared = {
    caption,
    mediaPreviewUrl,
    mediaMimeType,
    mediaItems,
    contentType,
    accountLabel,
  };

  if (!carousel) {
    const p = platforms[0];
    return (
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">{p.name}</p>
        <PlatformPreviewCard platform={p} platforms={platforms} {...shared} />
      </div>
    );
  }

  const go = (delta: number) => {
    setSlide((i) => (i + delta + platforms.length) % platforms.length);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label="Prévia anterior"
          onClick={() => go(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="min-w-0 flex-1 truncate text-center text-xs font-medium text-muted-foreground">
          {platforms[activeSlide]?.name}
          <span className="text-muted-foreground/70">
            {" "}
            · {activeSlide + 1}/{platforms.length}
          </span>
        </p>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label="Próxima prévia"
          onClick={() => go(1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {platforms.map((p) => (
            <div key={p.slug} className="w-full shrink-0 px-0.5">
              <PlatformPreviewCard platform={p} platforms={platforms} {...shared} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-1.5">
        {platforms.map((p, i) => (
          <button
            key={p.slug}
            type="button"
            aria-label={`Ver prévia ${p.name}`}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === activeSlide ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/40",
            )}
            onClick={() => setSlide(i)}
          />
        ))}
      </div>
    </div>
  );
}
