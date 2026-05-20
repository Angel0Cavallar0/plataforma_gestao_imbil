import { createAdminClient } from "@/lib/supabase/admin";
import { MARKETING_STORAGE_BUCKET } from "@/lib/constants/marketing";
import type { Asset, AssetWithPreview } from "@/types/marketing";

/** TTL for UI preview URLs (1 hour). */
const PREVIEW_URL_TTL_SEC = 60 * 60;

export async function getSignedAssetPreviewUrl(
  storagePath: string,
): Promise<string | null> {
  if (!storagePath) return null;
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(MARKETING_STORAGE_BUCKET)
    .createSignedUrl(storagePath, PREVIEW_URL_TTL_SEC);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function resolvePostAssetsPreviewUrls(
  assets: Asset[],
): Promise<AssetWithPreview[]> {
  return Promise.all(
    assets.map(async (asset) => {
      const preview_url =
        asset.public_url ??
        (asset.storage_path ? await getSignedAssetPreviewUrl(asset.storage_path) : null);
      return { ...asset, preview_url };
    }),
  );
}
