import { createClient } from "@/lib/supabase/server";
import { getNavPermissions, requireAuth } from "@/lib/auth/session";
import { UsersTable, type UserRow } from "@/components/users/users-table";
import { CreateUserDialog } from "@/components/users/create-user-dialog";

export default async function UsuariosPage() {
  const session = await requireAuth();
  const nav = await getNavPermissions(session.profile);
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, registration_number, status, roles(name)")
    .order("full_name");

  const { data: emailLogs } = await supabase
    .from("email_logs")
    .select("related_user_id, status, created_at")
    .order("created_at", { ascending: false });

  const lastEmailByUser = new Map<string, string>();
  emailLogs?.forEach((log) => {
    if (log.related_user_id && !lastEmailByUser.has(log.related_user_id)) {
      lastEmailByUser.set(log.related_user_id, log.status);
    }
  });

  const users: UserRow[] =
    profiles?.map((p) => {
      const role = p.roles as { name: string } | { name: string }[] | null;
      const roleName = Array.isArray(role) ? role[0]?.name : role?.name;
      return {
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        registration_number: p.registration_number,
        status: p.status,
        role_name: roleName ?? "—",
        last_email_status: lastEmailByUser.get(p.id) ?? null,
      };
    }) ?? [];

  const { data: roles } = await supabase
    .from("roles")
    .select("id, name, slug")
    .order("hierarchy_level", { ascending: false });
  const { data: modules } = await supabase
    .from("modules")
    .select("id, name")
    .order("display_order");

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, parent_id, responsible_id")
    .order("name");

  const { data: positions } = await supabase
    .from("positions")
    .select("id, name, department_id")
    .order("name");

  const { data: managers } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("status", "ativo")
    .order("full_name");

  return (
    <div className="space-y-6">
      {nav.canManageUsers && (
        <CreateUserDialog
          roles={roles ?? []}
          modules={modules ?? []}
          departments={departments ?? []}
          positions={positions ?? []}
          managers={managers ?? []}
        />
      )}
      <UsersTable
        users={users}
        nav={nav}
        userDetailCatalog={{
          roles: roles ?? [],
          modules: modules ?? [],
          departments: departments ?? [],
          positions: positions ?? [],
          managers: managers ?? [],
        }}
      />
    </div>
  );
}
