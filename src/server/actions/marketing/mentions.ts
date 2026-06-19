"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/session";
import { hasMarketingPermission } from "@/lib/auth/marketing";
import { logAction } from "@/lib/auth/audit";

/**
 * Marca/desmarca uma menção como respondida (controle operacional da equipe).
 * Escrita via service role; gated por marketing.read.
 */
export async function setMentionRespondedAction(
  id: string,
  responded: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireAuth();
  if (!(await hasMarketingPermission(session.user.id, "read"))) {
    return { ok: false, error: "Sem permissão" };
  }
  if (!id.trim()) return { ok: false, error: "ID inválido" };

  const admin = createAdminClient();
  const { error } = await admin
    .schema("marketing")
    .from("brand_mentions")
    .update({
      respondida: responded,
      respondida_em: responded ? new Date().toISOString() : null,
      respondida_por: responded ? session.user.id : null,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await logAction({
    userId: session.user.id,
    action: "mkt.mention.responded_toggled",
    resourceType: "marketing.brand_mentions",
    resourceId: id,
    metadata: { responded },
  });

  return { ok: true };
}
