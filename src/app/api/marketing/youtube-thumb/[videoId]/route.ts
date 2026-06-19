import { getSession } from "@/lib/auth/session";
import { requireMarketingPermission } from "@/lib/auth/marketing";
import { createClient } from "@/lib/supabase/server";
import { marketingSchema } from "@/lib/supabase/marketing";

/**
 * Proxy CSP-safe das thumbnails de vídeos do YouTube. Resolve o thumbnail_url
 * pelo video_id na marketing.imbil_youtube_videos (com fallback para o padrão
 * i.ytimg.com) e transmite o binário pela nossa origem (img-src 'self').
 * Gated por marketing.read.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ videoId: string }> },
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

  const { videoId } = await context.params;
  const decodedId = decodeURIComponent(videoId);

  const supabase = await createClient();
  const { data } = await marketingSchema(supabase)
    .from("imbil_youtube_videos")
    .select("thumbnail_url")
    .eq("video_id", decodedId)
    .order("collected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let resolved = (data as { thumbnail_url?: string } | null)?.thumbnail_url ?? null;

  // Fallback para vídeos de concorrentes (mesma estrutura, outra tabela).
  if (!resolved) {
    const { data: comp } = await marketingSchema(supabase)
      .from("competitor_youtube_videos")
      .select("thumbnail_url")
      .eq("video_id", decodedId)
      .order("collected_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    resolved = (comp as { thumbnail_url?: string } | null)?.thumbnail_url ?? null;
  }

  const thumbnailUrl =
    resolved ?? `https://i.ytimg.com/vi/${encodeURIComponent(decodedId)}/hqdefault.jpg`;

  const upstream = await fetch(thumbnailUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ImbilGestao/1.0; +https://imbil.com.br)",
      Accept: "image/*,*/*",
    },
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("Falha ao obter imagem do YouTube", { status: 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "private, max-age=300",
    },
  });
}
