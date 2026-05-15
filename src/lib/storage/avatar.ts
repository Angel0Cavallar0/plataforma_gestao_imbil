import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "avatars";

/** Extrai o path no bucket a partir de URL completa ou path relativo. */
export function parseAvatarStoragePath(
  avatarUrl: string | null | undefined,
  userId: string,
): string | null {
  if (!avatarUrl) return null;

  const publicMarker = "/avatars/";
  const signedMarker = "/object/sign/avatars/";

  if (avatarUrl.includes(publicMarker)) {
    const after = avatarUrl.split(publicMarker)[1] ?? "";
    return after.split("?")[0] || null;
  }

  if (avatarUrl.includes(signedMarker)) {
    const after = avatarUrl.split(signedMarker)[1] ?? "";
    return after.split("?")[0] || null;
  }

  if (avatarUrl.includes("/")) {
    return avatarUrl.split("?")[0];
  }

  return `${userId}/avatar.png`;
}

/** URL pública com cache-bust para exibição no cliente. */
export function getAvatarPublicDisplayUrl(
  avatarUrl: string | null | undefined,
  userId: string,
  cacheVersion?: string | number | null,
): string | null {
  const path = parseAvatarStoragePath(avatarUrl, userId);
  if (!path) return null;

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return null;

  const version =
    cacheVersion != null && cacheVersion !== ""
      ? encodeURIComponent(String(cacheVersion))
      : String(Date.now());

  return `${baseUrl}/storage/v1/object/public/${BUCKET}/${path}?v=${version}`;
}

/** Remove outros arquivos da pasta do usuário, mantendo apenas o path atual. */
export async function removeStaleAvatarFiles(
  supabase: SupabaseClient,
  userId: string,
  keepPath: string,
): Promise<void> {
  const keepFileName = keepPath.split("/").pop();
  if (!keepFileName) return;

  const { data: files, error } = await supabase.storage.from(BUCKET).list(userId);
  if (error || !files?.length) return;

  const toRemove = files
    .filter((file) => file.name && file.name !== keepFileName)
    .map((file) => `${userId}/${file.name}`);

  if (toRemove.length > 0) {
    await supabase.storage.from(BUCKET).remove(toRemove);
  }
}
