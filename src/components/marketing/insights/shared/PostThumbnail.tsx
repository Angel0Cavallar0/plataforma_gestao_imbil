"use client";

import { useState } from "react";
import { Film, FileText, ImageIcon, Images } from "lucide-react";
import { cn } from "@/lib/utils";

function TypeIcon({ mediaType }: { mediaType?: string | null }) {
  const t = (mediaType ?? "").toUpperCase();
  if (t.includes("VIDEO") || t.includes("REEL"))
    return <Film className="h-6 w-6 text-muted-foreground" />;
  if (t.includes("CAROUSEL") || t.includes("ALBUM") || t.includes("MULTI"))
    return <Images className="h-6 w-6 text-muted-foreground" />;
  if (t === "TEXT" || t === "NONE" || t === "ARTICLE" || t === "DOCUMENT" || t === "POLL")
    return <FileText className="h-6 w-6 text-muted-foreground" />;
  return <ImageIcon className="h-6 w-6 text-muted-foreground" />;
}

// Tipos do LinkedIn sem imagem de capa → vão direto para o placeholder.
const LINKEDIN_NO_THUMB = new Set(["TEXT", "NONE", "POLL"]);

/**
 * Miniatura de um post. Instagram, Facebook e LinkedIn usam proxies internos
 * (CSP-safe, mídia espelhada no bucket privado, gated por marketing.read).
 * Vídeos pedem a capa (?thumb=1). Posts sem mídia (ou falha de carregamento)
 * caem no placeholder com ícone do tipo.
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
  // Vídeos/Reels: usa a capa (?thumb=1 → thumbnail_storage_url) em vez do .mp4.
  const t = (mediaType ?? "").toUpperCase();
  const isVideo = t.includes("VIDEO") || t.includes("REEL");
  const proxyBase =
    network === "instagram"
      ? `/api/marketing/instagram-media/${encodeURIComponent(id)}`
      : network === "facebook"
        ? `/api/marketing/facebook-post/${encodeURIComponent(id)}`
        : network === "linkedin" && !LINKEDIN_NO_THUMB.has(t)
          ? `/api/marketing/linkedin-post/${encodeURIComponent(id)}`
          : null;
  const src = proxyBase ? `${proxyBase}${isVideo ? "?thumb=1" : ""}` : null;

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
