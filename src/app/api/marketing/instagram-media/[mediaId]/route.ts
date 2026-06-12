import { getSession } from "@/lib/auth/session";
import { requireMarketingPermission } from "@/lib/auth/marketing";
import {
  getInstagramCarouselChildById,
  getInstagramMediaLatest,
} from "@/server/queries/marketing/instagram-insights";

async function proxyMediaUrl(mediaUrl: string, fallbackType: string) {
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
    (fallbackType === "VIDEO" || fallbackType === "REELS" ? "video/mp4" : "image/jpeg");

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
  const childId = new URL(request.url).searchParams.get("child");

  let mediaUrl: string | null = null;
  let mediaType = "IMAGE";

  if (childId) {
    const child = await getInstagramCarouselChildById(childId);
    mediaUrl = child?.media_url ?? child?.thumbnail_url ?? null;
    mediaType = child?.media_type ?? "IMAGE";
  } else {
    const latest = await getInstagramMediaLatest(decodedId);
    if (!latest) {
      return new Response("Mídia não encontrada", { status: 404 });
    }
    mediaUrl = latest.media_url ?? latest.thumbnail_url ?? null;
    mediaType = latest.media_type;
  }

  if (!mediaUrl) {
    return new Response("Mídia não encontrada", { status: 404 });
  }

  const response = await proxyMediaUrl(mediaUrl, mediaType);
  if (!response) {
    return new Response("Falha ao obter mídia do Instagram", { status: 502 });
  }

  return response;
}
