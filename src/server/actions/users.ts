"use server";

import { requireAuth } from "@/lib/auth/session";
import {
  canAccessConfig,
  canManageUsers,
  canUnlockOrResetPassword,
  isSuperadmin,
} from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logAction } from "@/lib/auth/audit";
import {
  logAuthEmail,
  sendInviteUserEmail,
  sendRecoveryEmail,
} from "@/lib/auth/supabase-email";
import { createUserSchema, updateUserSchema } from "@/lib/validations/user";
import { revalidatePath } from "next/cache";

export async function createUserAction(formData: FormData) {
  const session = await requireAuth();
  if (!canManageUsers(session.profile)) {
    return { error: "Sem permissão para criar usuários." };
  }

  const raw = Object.fromEntries(formData.entries());
  const moduleIds = formData.getAll("module_ids") as string[];

  const parsed = createUserSchema.safeParse({
    ...raw,
    module_ids: moduleIds.length ? moduleIds : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const admin = createAdminClient();
  const email = parsed.data.email.toLowerCase();

  const inviteResult = await sendInviteUserEmail(admin, email, {
    full_name: parsed.data.full_name,
  });

  if (!inviteResult.ok || !inviteResult.userId) {
    const message = inviteResult.ok
      ? "Erro ao obter usuário após convite."
      : inviteResult.error;
    await logAuthEmail(admin, {
      recipient: email,
      type: "password_setup",
      status: "failed",
      errorMessage: message,
    });
    return { error: message };
  }

  const invitedUserId = inviteResult.userId;

  const { error: profileError } = await admin.from("profiles").insert({
    id: invitedUserId,
    full_name: parsed.data.full_name,
    email,
    registration_number: parsed.data.registration_number,
    role_id: parsed.data.role_id,
    department_id: parsed.data.department_id ?? null,
    position_id: parsed.data.position_id ?? null,
    manager_id: parsed.data.manager_id ?? null,
    admission_date: parsed.data.admission_date ?? null,
    status: parsed.data.status,
    created_by: session.profile.id,
    must_change_password: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(invitedUserId);
    await logAuthEmail(admin, {
      recipient: email,
      type: "password_setup",
      status: "failed",
      relatedUserId: invitedUserId,
      errorMessage: profileError.message,
    });
    return { error: profileError.message };
  }

  if (moduleIds.length) {
    await admin.from("user_module_access").insert(
      moduleIds.map((module_id) => ({
        user_id: invitedUserId,
        module_id,
        granted_by: session.profile.id,
      })),
    );
  }

  await logAuthEmail(admin, {
    recipient: email,
    type: "password_setup",
    status: "sent",
    relatedUserId: invitedUserId,
  });

  await logAction({
    userId: session.profile.id,
    action: "user.created",
    resourceType: "profile",
    resourceId: invitedUserId,
    metadata: { email, email_sent: true, auth_email: "invite" },
  });

  revalidatePath("/configuracoes/usuarios");
  return { success: true };
}

export async function updateUserAction(formData: FormData) {
  const session = await requireAuth();
  if (!canManageUsers(session.profile)) {
    return { error: "Sem permissão para editar usuários." };
  }

  const moduleIds = formData.getAll("module_ids") as string[];
  const parsed = updateUserSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    module_ids: moduleIds,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { id, module_ids, ...updates } = parsed.data;
  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  if (module_ids) {
    await admin.from("user_module_access").delete().eq("user_id", id);
    if (module_ids.length) {
      await admin.from("user_module_access").insert(
        module_ids.map((module_id) => ({
          user_id: id,
          module_id,
          granted_by: session.profile.id,
        })),
      );
    }
  }

  await logAction({
    userId: session.profile.id,
    action: "user.updated",
    resourceType: "profile",
    resourceId: id,
    metadata: updates,
  });

  revalidatePath("/configuracoes/usuarios");
  return { success: true };
}

export async function deactivateUserAction(userId: string) {
  const session = await requireAuth();
  if (!canManageUsers(session.profile)) {
    return { error: "Sem permissão." };
  }

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      status: "inativo",
      deactivated_at: new Date().toISOString(),
      deactivated_by: session.profile.id,
    })
    .eq("id", userId);

  await logAction({
    userId: session.profile.id,
    action: "user.deactivated",
    resourceType: "profile",
    resourceId: userId,
  });

  revalidatePath("/configuracoes/usuarios");
  return { success: true };
}

export async function unlockUserAction(userId: string) {
  const session = await requireAuth();
  if (!canUnlockOrResetPassword(session.profile)) {
    return { error: "Sem permissão." };
  }

  const admin = createAdminClient();
  await admin.from("account_lockouts").delete().eq("user_id", userId);
  await admin
    .from("profiles")
    .update({ status: "ativo" })
    .eq("id", userId)
    .eq("status", "bloqueado");

  await logAction({
    userId: session.profile.id,
    action: "user.unlocked",
    resourceType: "profile",
    resourceId: userId,
  });

  revalidatePath("/configuracoes/usuarios");
  return { success: true };
}

export async function requestPasswordResetAction(
  userId: string,
  type: "setup" | "reset",
) {
  const session = await requireAuth();
  if (!canUnlockOrResetPassword(session.profile)) {
    return { error: "Sem permissão." };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  if (!profile) return { error: "Usuário não encontrado." };

  const emailResult =
    type === "setup"
      ? await sendInviteUserEmail(admin, profile.email)
      : await sendRecoveryEmail(admin, profile.email);

  await logAuthEmail(admin, {
    recipient: profile.email,
    type: type === "setup" ? "password_setup" : "password_reset",
    status: emailResult.ok ? "sent" : "failed",
    relatedUserId: userId,
    errorMessage: emailResult.ok ? undefined : emailResult.error,
  });

  await logAction({
    userId: session.profile.id,
    action:
      type === "setup"
        ? "auth.password.setup.requested"
        : "auth.password.reset.requested",
    resourceType: "profile",
    resourceId: userId,
    metadata: {
      email_sent: emailResult.ok,
      auth_email: type === "setup" ? "invite" : "recovery",
    },
  });

  revalidatePath("/configuracoes/usuarios");
  if (!emailResult.ok) {
    return { error: emailResult.error };
  }
  return { success: true };
}

export async function deleteUserAction(userId: string, confirmEmail: string) {
  const session = await requireAuth();
  if (!isSuperadmin(session.profile)) {
    return { error: "Apenas superadmin pode excluir usuários." };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  if (!profile || profile.email !== confirmEmail) {
    return { error: "E-mail de confirmação não confere." };
  }

  await admin.auth.admin.deleteUser(userId);

  await logAction({
    userId: session.profile.id,
    action: "user.deleted",
    resourceType: "profile",
    resourceId: userId,
  });

  revalidatePath("/configuracoes/usuarios");
  return { success: true };
}

export interface UserDetailData {
  id: string;
  full_name: string;
  email: string;
  registration_number: string;
  phone: string | null;
  whatsapp: string | null;
  status: string;
  last_login_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  admission_date: string | null;
  must_change_password: boolean | null;
  password_changed_at: string | null;
  deactivated_at: string | null;
  role_name: string;
  role_slug: string;
  department_name: string | null;
  position_name: string | null;
  manager_name: string | null;
  module_names: string[];
  last_email_status: string | null;
  last_email_at: string | null;
}

export interface UserAuditLogRow {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  created_at: string | null;
  ip_address: string | null;
}

export async function getUserDetailAction(userId: string) {
  const session = await requireAuth();
  if (!canAccessConfig(session.profile)) {
    return { error: "Sem permissão." };
  }

  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      `
      id, full_name, email, registration_number, phone, whatsapp,
      status, last_login_at, created_at, updated_at, admission_date,
      must_change_password, password_changed_at, deactivated_at,
      roles(name, slug),
      departments(name),
      positions(name),
      manager:profiles!profiles_manager_id_fkey(full_name),
      user_module_access(modules(name))
    `,
    )
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return { error: "Usuário não encontrado." };
  }

  const { data: emailLogs } = await supabase
    .from("email_logs")
    .select("status, created_at")
    .eq("related_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  const roleRaw = profile.roles as
    | { name: string; slug: string }
    | { name: string; slug: string }[]
    | null;
  const role = Array.isArray(roleRaw) ? roleRaw[0] : roleRaw;

  const departmentRaw = profile.departments as
    | { name: string }
    | { name: string }[]
    | null;
  const department = Array.isArray(departmentRaw) ? departmentRaw[0] : departmentRaw;

  const positionRaw = profile.positions as { name: string } | { name: string }[] | null;
  const position = Array.isArray(positionRaw) ? positionRaw[0] : positionRaw;

  const managerRaw = profile.manager as
    | { full_name: string }
    | { full_name: string }[]
    | null;
  const manager = Array.isArray(managerRaw) ? managerRaw[0] : managerRaw;
  const moduleAccess = (profile.user_module_access ?? []) as {
    modules: { name: string } | { name: string }[] | null;
  }[];

  const moduleNames = moduleAccess
    .map((entry) => {
      const mod = entry.modules;
      if (!mod) return null;
      if (Array.isArray(mod)) return mod[0]?.name ?? null;
      return mod.name;
    })
    .filter((name): name is string => Boolean(name));

  const lastEmail = emailLogs?.[0];

  const data: UserDetailData = {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    registration_number: profile.registration_number,
    phone: profile.phone,
    whatsapp: profile.whatsapp,
    status: profile.status,
    last_login_at: profile.last_login_at,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    admission_date: profile.admission_date,
    must_change_password: profile.must_change_password,
    password_changed_at: profile.password_changed_at,
    deactivated_at: profile.deactivated_at,
    role_name: role?.name ?? "—",
    role_slug: role?.slug ?? "—",
    department_name: department?.name ?? null,
    position_name: position?.name ?? null,
    manager_name: manager?.full_name ?? null,
    module_names: moduleNames,
    last_email_status: lastEmail?.status ?? null,
    last_email_at: lastEmail?.created_at ?? null,
  };

  return { data };
}

export async function getUserAuditLogsAction(userId: string, limit = 30) {
  const session = await requireAuth();
  if (!canAccessConfig(session.profile)) {
    return { error: "Sem permissão." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, resource_type, resource_id, created_at, ip_address")
    .or(`user_id.eq.${userId},and(resource_type.eq.profile,resource_id.eq.${userId})`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { error: error.message };
  }

  return { data: (data ?? []) as UserAuditLogRow[] };
}
