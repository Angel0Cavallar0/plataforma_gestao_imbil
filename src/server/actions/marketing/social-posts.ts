"use server";

import { createClient } from "@/lib/supabase/server";
import { marketingSchema } from "@/lib/supabase/marketing";
import { requireAuth } from "@/lib/auth/session";
import { hasMarketingPermission } from "@/lib/auth/marketing";

/**
 * Retorna a linha mais recente (todas as colunas) de um post orgânico para o
 * pop-up de detalhes. Métricas são cumulativas → pega a maior data_referencia.
 */
export async function getSocialPostDetailAction(
  network: "instagram" | "facebook" | "linkedin",
  id: string,
): Promise<{ data?: Record<string, unknown>; error?: string }> {
  const session = await requireAuth();
  if (!(await hasMarketingPermission(session.user.id, "read"))) {
    return { error: "Sem permissão" };
  }
  if (!id.trim()) return { error: "ID inválido" };

  const supabase = await createClient();
  const mk = marketingSchema(supabase);

  const table =
    network === "instagram"
      ? "instagram_media_insights"
      : network === "facebook"
        ? "facebook_post_insights"
        : "linkedin_post_insights";
  const idColumn = network === "instagram" ? "media_id" : "post_id";

  const { data, error } = await mk
    .from(table)
    .select("*")
    .eq(idColumn, id)
    .order("data_referencia", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { error: error.message };
  return { data: (data as Record<string, unknown> | null) ?? undefined };
}
