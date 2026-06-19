import { getSession } from "@/lib/auth/session";
import { requireMarketingPermission } from "@/lib/auth/marketing";
import { createClient } from "@/lib/supabase/server";
import { marketingSchema } from "@/lib/supabase/marketing";

/**
 * Proxy CSP-safe das thumbnails de posts do LinkedIn. O `thumbnail_url` (CDN
 * licdn) é resolvido pelo post_id na marketing.linkedin_post_insights e o
 * binário é transmitido pela nossa origem (img-src 'self'). Gated por
 * marketing.read. Posts sem thumbnail (texto/enquete) retornam 404 → placeholder.
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

  const supabase = await createClient();
  const { data } = await marketingSchema(supabase)
    .from("linkedin_post_insights")
    .select("thumbnail_url")
    .eq("post_id", decodedId)
    .not("thumbnail_url", "is", null)
    .order("data_referencia", { ascending: false })
    .limit(1)
    .maybeSingle();

  const thumbnailUrl = (data as { thumbnail_url?: string } | null)?.thumbnail_url ?? null;
  if (!thumbnailUrl) {
    return new Response("Sem thumbnail", { status: 404 });
  }

  const upstream = await fetch(thumbnailUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ImbilGestao/1.0; +https://imbil.com.br)",
      Accept: "image/*,*/*",
    },
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("Falha ao obter imagem do LinkedIn", { status: 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "private, max-age=300",
    },
  });
}
