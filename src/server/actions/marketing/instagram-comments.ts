"use server";

import { fetchInstagramMediaComments } from "@/lib/integrations/meta/comments";
import { getMetaToken } from "@/lib/integrations/meta/credentials";
import { createClient } from "@/lib/supabase/server";
import { marketingSchema } from "@/lib/supabase/marketing";
import { requireAuth } from "@/lib/auth/session";
import { requireMarketingPermission } from "@/lib/auth/marketing";
import type { InstagramMediaComment } from "@/types/marketing";

async function resolveInstagramCredentialId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: igPlatform } = await marketingSchema(supabase)
    .from("platforms")
    .select("id")
    .eq("slug", "instagram")
    .maybeSingle();

  if (!igPlatform?.id) return null;

  const { data: cred } = await marketingSchema(supabase)
    .from("integration_credentials")
    .select("id")
    .eq("platform_id", igPlatform.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (cred?.id as string) ?? null;
}

export async function fetchInstagramMediaCommentsAction(
  mediaId: string,
): Promise<{ data?: InstagramMediaComment[]; error?: string }> {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "read");

  if (!mediaId.trim()) return { error: "ID da mídia inválido" };

  const credentialId = await resolveInstagramCredentialId();
  if (!credentialId) {
    return {
      error: "Nenhuma credencial Instagram ativa. Configure em Integrações Meta.",
    };
  }

  try {
    const token = await getMetaToken(credentialId);
    const comments = await fetchInstagramMediaComments(mediaId, token);
    return { data: comments };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Falha ao buscar comentários na Meta",
    };
  }
}
