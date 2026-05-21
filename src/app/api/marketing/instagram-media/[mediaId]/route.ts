import { getSession } from "@/lib/auth/session";
import { requireMarketingPermission } from "@/lib/auth/marketing";
import { getInstagramMediaLatest } from "@/server/queries/marketing/instagram-insights";

export async function GET(
  _request: Request,
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
  const latest = await getInstagramMediaLatest(decodedId);

  if (!latest?.media_url) {
    return new Response("Mídia não encontrada", { status: 404 });
  }

  const upstream = await fetch(latest.media_url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ImbilGestao/1.0; +https://imbil.com.br)",
      Accept: "video/*,image/*,*/*",
    },
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("Falha ao obter mídia do Instagram", { status: 502 });
  }

  const contentType =
    upstream.headers.get("content-type") ??
    (latest.media_type === "VIDEO" ? "video/mp4" : "image/jpeg");

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
    },
  });
}
