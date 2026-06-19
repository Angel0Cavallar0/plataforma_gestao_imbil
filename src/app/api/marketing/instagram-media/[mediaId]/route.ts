import { getSession } from "@/lib/auth/session";
import { requireMarketingPermission } from "@/lib/auth/marketing";
import { createClient } from "@/lib/supabase/server";
import { proxyMarketingStorageMedia } from "@/lib/marketing/media-storage";
import {
  getInstagramCarouselChildById,
  getInstagramMediaLatest,
} from "@/server/queries/marketing/instagram-insights";

/** Fallback legado: proxy direto da CDN da Meta para linhas ainda sem mídia no bucket. */
async function proxyMediaUrl(
  mediaUrl: string,
  fallbackType: string,
  preferImage = false,
) {
  const upstream = await fetch(mediaUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ImbilGestao/1.0; +https://imbil.com.br)",
      Accept: "video/*,image/*,*/*",
    },
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    return null;
  }

  const contentType =
    upstream.headers.get("content-type") ??
    (preferImage
      ? "image/jpeg"
      : fallbackType === "VIDEO" || fallbackType === "REELS"
        ? "video/mp4"
        : "image/jpeg");

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
    },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ mediaId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return new Response("Não autenticado", { status: 401 });
  }

  try {
    await requireMarketingPermission(session.user.id, "read");
  } catch {
    return new Response("Sem permissão", { status: 403 });
  }

  const { mediaId } = await context.params;
  const decodedId = decodeURIComponent(mediaId);
  const url = new URL(request.url);
  const childId = url.searchParams.get("child");
  // ?thumb=1 → servir a capa (thumbnail_storage_url), ex.: vídeos no grid/poster.
  const wantThumb = url.searchParams.get("thumb") === "1";

  let storageUrl: string | null = null;
  let cdnUrl: string | null = null;
  let mediaType = "IMAGE";

  if (childId) {
    const child = await getInstagramCarouselChildById(childId);
    if (!child) {
      return new Response("Mídia não encontrada", { status: 404 });
    }
    mediaType = child.media_type ?? "IMAGE";
    storageUrl = wantThumb
      ? (child.thumbnail_storage_url ?? child.media_storage_url)
      : (child.media_storage_url ?? child.thumbnail_storage_url);
    cdnUrl = wantThumb
      ? (child.thumbnail_url ?? child.media_url)
      : (child.media_url ?? child.thumbnail_url);
  } else {
    const latest = await getInstagramMediaLatest(decodedId);
    if (!latest) {
      return new Response("Mídia não encontrada", { status: 404 });
    }
    mediaType = latest.media_type;
    storageUrl = wantThumb
      ? (latest.thumbnail_storage_url ?? latest.media_storage_url)
      : (latest.media_storage_url ?? latest.thumbnail_storage_url);
    cdnUrl = wantThumb
      ? (latest.thumbnail_url ?? latest.media_url)
      : (latest.media_url ?? latest.thumbnail_url);
  }

  // Preferir a mídia espelhada no bucket privado (URL assinada + proxy).
  const supabase = await createClient();
  const fromStorage = await proxyMarketingStorageMedia(supabase, storageUrl);
  if (fromStorage) {
    return fromStorage;
  }

  // Fallback: CDN da Meta (linhas ainda não espelhadas).
  if (cdnUrl) {
    const fromCdn = await proxyMediaUrl(cdnUrl, mediaType, wantThumb);
    if (fromCdn) {
      return fromCdn;
    }
  }

  return new Response("Mídia não encontrada", { status: 404 });
}
