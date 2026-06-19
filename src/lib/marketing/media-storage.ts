import type { SupabaseClient } from "@supabase/supabase-js";
import { MARKETING_STORAGE_BUCKET } from "@/lib/constants/marketing";

/** TTL curto: a URL assinada só é usada imediatamente pelo proxy server-side. */
const SIGNED_URL_TTL_SEC = 60 * 5;

/**
 * Extrai o path dentro do bucket marketing-content-assets a partir da
 * media_storage_url/thumbnail_storage_url (URL `/object/authenticated/...` sem
 * token) ou de um path relativo já salvo. Ex.: `instagram/123.jpg`.
 */
export function parseMarketingStoragePath(
  storageUrl: string | null | undefined,
): string | null {
  if (!storageUrl) return null;

  const marker = `/${MARKETING_STORAGE_BUCKET}/`;
  const idx = storageUrl.indexOf(marker);
  if (idx !== -1) {
    return storageUrl.slice(idx + marker.length).split("?")[0] || null;
  }

  // Já é um path relativo dentro do bucket (sem o domínio do Supabase).
  if (!storageUrl.startsWith("http")) {
    return storageUrl.split("?")[0] || null;
  }

  return null;
}

/**
 * URL assinada de curta duração para uma mídia do bucket privado
 * marketing-content-assets. A leitura exige usuário autenticado com permissão
 * marketing.read (policy `marketing_content_assets_select`) — mesmo padrão do
 * `getAvatarSignedUrl`, usando o cliente Supabase autenticado por cookie.
 */
export async function getMarketingMediaSignedUrl(
  supabase: SupabaseClient,
  storageUrl: string | null | undefined,
  expiresInSeconds = SIGNED_URL_TTL_SEC,
): Promise<string | null> {
  const path = parseMarketingStoragePath(storageUrl);
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(MARKETING_STORAGE_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/**
 * Resolve a URL assinada e transmite o binário pela nossa origem (img-src/
 * default-src 'self', sem expor o token nem o domínio do bucket ao browser).
 * Retorna null quando não há mídia no storage ou a busca falha (o chamador
 * decide o fallback/404).
 */
export async function proxyMarketingStorageMedia(
  supabase: SupabaseClient,
  storageUrl: string | null | undefined,
): Promise<Response | null> {
  const signedUrl = await getMarketingMediaSignedUrl(supabase, storageUrl);
  if (!signedUrl) return null;

  const upstream = await fetch(signedUrl, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) return null;

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "private, max-age=300",
    },
  });
}
