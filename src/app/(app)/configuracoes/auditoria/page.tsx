import { createClient } from "@/lib/supabase/server";
import { getNavPermissions, requireAuth } from "@/lib/auth/session";
import { AuditTable, type AuditRow } from "@/components/audit/audit-table";
import { ExportAuditButton } from "@/components/audit/export-audit-button";

export default async function AuditoriaPage() {
  const session = await requireAuth();
  const nav = await getNavPermissions(session.profile);
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, action, resource_type, resource_id, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows: AuditRow[] = logs ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportAuditButton />
      </div>
      <AuditTable logs={rows} canDelete={nav.canDeleteAuditLogs} />
    </div>
  );
}
