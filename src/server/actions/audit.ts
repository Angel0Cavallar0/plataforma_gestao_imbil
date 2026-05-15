"use server";

import { requireAuth } from "@/lib/auth/session";
import { canAccessConfig, isSuperadmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/auth/audit";
import { revalidatePath } from "next/cache";

export async function exportAuditLogsCsv(): Promise<string> {
  const session = await requireAuth();
  if (!canAccessConfig(session.profile)) {
    throw new Error("Sem permissão.");
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("id, action, resource_type, resource_id, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  const header = "id,action,resource_type,resource_id,user_id,created_at\n";
  const rows =
    data
      ?.map(
        (r) =>
          `${r.id},${r.action},${r.resource_type},${r.resource_id ?? ""},${r.user_id ?? ""},${r.created_at}`,
      )
      .join("\n") ?? "";

  await logAction({
    userId: session.profile.id,
    action: "audit.export",
    resourceType: "audit_logs",
  });

  return header + rows;
}

export async function deleteAuditLogAction(logId: string, confirmAction: string) {
  const session = await requireAuth();
  if (!isSuperadmin(session.profile)) {
    return { error: "Apenas superadmin pode excluir logs." };
  }

  if (confirmAction !== "EXCLUIR") {
    return { error: 'Digite "EXCLUIR" para confirmar.' };
  }

  const admin = createAdminClient();
  await admin.from("audit_logs").delete().eq("id", logId);

  await logAction({
    userId: session.profile.id,
    action: "audit.deleted",
    resourceType: "audit_logs",
    resourceId: logId,
  });

  revalidatePath("/configuracoes/auditoria");
  return { success: true };
}
