import { getSession } from "@/lib/auth/session";
import { requireMarketingPermission } from "@/lib/auth/marketing";
import { createClient } from "@/lib/supabase/server";
import { marketingSchema } from "@/lib/supabase/marketing";
import { proxyMarketingStorageMedia } from "@/lib/marketing/media-storage";

/**
 * Proxy CSP-safe da mídia de posts do Facebook espelhada no bucket privado
 * (media_storage_url = imagem/vídeo; thumbnail_storage_url = capa do vídeo). A
 * URL assinada é resolvida no servidor e o binário transmitido pela nossa
 * origem (default-src/img-src 'self'). Gated por marketing.read. Posts sem mídia
 * (texto/link) retornam 404 → placeholder.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ postId: string }> },
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

  const { postId } = await context.params;
  const decodedId = decodeURIComponent(postId);
  // ?thumb=1 → servir a capa (thumbnail_storage_url), ex.: vídeos no grid/poster.
  const wantThumb = new URL(request.url).searchParams.get("thumb") === "1";

  const supabase = await createClient();
  const { data } = await marketingSchema(supabase)
    .from("facebook_post_insights")
    .select("media_storage_url, thumbnail_storage_url")
    .eq("post_id", decodedId)
    .order("data_referencia", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = data as {
    media_storage_url?: string | null;
    thumbnail_storage_url?: string | null;
  } | null;

  const storageUrl = wantThumb
    ? (row?.thumbnail_storage_url ?? row?.media_storage_url ?? null)
    : (row?.media_storage_url ?? row?.thumbnail_storage_url ?? null);

  const fromStorage = await proxyMarketingStorageMedia(supabase, storageUrl);
  if (fromStorage) {
    return fromStorage;
  }

  return new Response("Sem mídia", { status: 404 });
}
