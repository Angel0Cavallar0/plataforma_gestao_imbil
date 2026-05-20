"use client";

import { CONTENT_TYPE_LABELS } from "@/lib/constants/marketing";
import type { ContentType } from "@/types/marketing";
import { cn } from "@/lib/utils";

export type PreviewPlatform = {
  slug: string;
  name: string;
};

type Props = {
  platforms: PreviewPlatform[];
  caption: string;
  mediaPreviewUrl: string | null;
  mediaMimeType?: string;
  contentType: ContentType;
  ctaUrl?: string;
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

function InstagramPreview({
  caption,
  mediaPreviewUrl,
  mediaMimeType,
  contentType,
  accountLabel,
}: Omit<Props, "platforms" | "ctaUrl">) {
  const lines = caption.trim().split("\n");
  const firstLine = lines[0] ?? "";
  const rest = lines.slice(1).join("\n");

  return (
    <div className="overflow-hidden rounded-xl border bg-white text-black shadow-sm">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
          <div className="h-full w-full rounded-full bg-white p-[1px]">
            <div className="h-full w-full rounded-full bg-muted" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{accountLabel ?? "imbil"}</p>
          <p className="text-[10px] text-neutral-500">Instagram</p>
        </div>
      </div>
      <MediaBlock
        url={mediaPreviewUrl}
        mimeType={mediaMimeType}
        contentType={contentType}
      />
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
  contentType,
  ctaUrl,
  accountLabel,
}: Omit<Props, "platforms">) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white text-black shadow-sm">
      <div className="flex items-center gap-2 border-b bg-[#1877F2]/10 px-3 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1877F2] text-xs font-bold text-white">
          {(accountLabel ?? "I").charAt(0).toUpperCase()}
        </div>
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
        {ctaUrl && contentType === "link" && (
          <div className="rounded-md border bg-neutral-50 p-2">
            <p className="truncate text-[10px] font-medium uppercase text-neutral-500">
              Link
            </p>
            <p className="truncate text-xs text-[#1877F2]">{ctaUrl}</p>
          </div>
        )}
      </div>
      {contentType !== "texto" && contentType !== "link" && (
        <MediaBlock
          url={mediaPreviewUrl}
          mimeType={mediaMimeType}
          contentType={contentType}
        />
      )}
    </div>
  );
}

export function PostSocialPreview({
  platforms,
  caption,
  mediaPreviewUrl,
  mediaMimeType,
  contentType,
  ctaUrl,
  accountLabel,
}: Props) {
  if (!platforms.length) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Selecione ao menos uma rede social para ver a prévia.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "space-y-4",
        platforms.length > 1 && "max-h-[calc(100vh-8rem)] overflow-y-auto pr-1",
      )}
    >
      {platforms.map((p) => (
        <div key={p.slug}>
          <p className="mb-2 text-xs font-medium text-muted-foreground">{p.name}</p>
          {p.slug === "instagram" ? (
            <InstagramPreview
              caption={caption}
              mediaPreviewUrl={mediaPreviewUrl}
              mediaMimeType={mediaMimeType}
              contentType={contentType}
              accountLabel={accountLabel}
            />
          ) : (
            <FacebookPreview
              caption={caption}
              mediaPreviewUrl={mediaPreviewUrl}
              mediaMimeType={mediaMimeType}
              contentType={contentType}
              ctaUrl={ctaUrl}
              accountLabel={accountLabel}
            />
          )}
        </div>
      ))}
    </div>
  );
}
