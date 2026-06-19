"use client";

import { useState } from "react";
import { Film, ImageIcon, Images } from "lucide-react";
import { cn } from "@/lib/utils";

function TypeIcon({ mediaType }: { mediaType?: string | null }) {
  const t = (mediaType ?? "").toUpperCase();
  if (t.includes("VIDEO") || t.includes("REEL"))
    return <Film className="h-6 w-6 text-muted-foreground" />;
  if (t.includes("CAROUSEL") || t.includes("ALBUM"))
    return <Images className="h-6 w-6 text-muted-foreground" />;
  return <ImageIcon className="h-6 w-6 text-muted-foreground" />;
}

/**
 * Miniatura de um post. Instagram usa o proxy interno (CSP-safe e gated por
 * marketing.read); Facebook não tem thumbnail → placeholder com ícone do tipo.
 */
export function PostThumbnail({
  network,
  id,
  mediaType,
  className,
  fit = "cover",
}: {
  network: "instagram" | "facebook" | "linkedin";
  id: string;
  mediaType?: string | null;
  className?: string;
  /** "cover" (recorta, padrão do grid) ou "contain" (mostra a imagem inteira). */
  fit?: "cover" | "contain";
}) {
  const [failed, setFailed] = useState(false);
  // Vídeos/Reels do Instagram: usa a capa (thumbnail_url) em vez do .mp4.
  const t = (mediaType ?? "").toUpperCase();
  const isVideo = t.includes("VIDEO") || t.includes("REEL");
  const src =
    network === "instagram"
      ? `/api/marketing/instagram-media/${encodeURIComponent(id)}${isVideo ? "?thumb=1" : ""}`
      : null;

  const box = cn(
    "flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted",
    className,
  );

  if (!src || failed) {
    return (
      <div className={box}>
        <TypeIcon mediaType={mediaType} />
      </div>
    );
  }

  return (
    <div className={box}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className={cn(
          "h-full w-full",
          fit === "contain" ? "object-contain" : "object-cover",
        )}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
