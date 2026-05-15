"use server";

import { requireAuth } from "@/lib/auth/session";
import {
  canManageUsers,
  canUnlockOrResetPassword,
  isSuperadmin,
} from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/auth/audit";
import { createUserSchema, updateUserSchema } from "@/lib/validations/user";
import {
  buildPasswordLink,
  generateToken,
  getTokenExpiry,
  hashToken,
} from "@/lib/auth/password";
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
  const tempPassword = generateToken();

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: parsed.data.email.toLowerCase(),
    password: tempPassword,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    return { error: authError?.message ?? "Erro ao criar usuário no Auth." };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: authUser.user.id,
    full_name: parsed.data.full_name,
    email: parsed.data.email.toLowerCase(),
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
    await admin.auth.admin.deleteUser(authUser.user.id);
    return { error: profileError.message };
  }

  if (moduleIds.length) {
    await admin.from("user_module_access").insert(
      moduleIds.map((module_id) => ({
        user_id: authUser.user!.id,
        module_id,
        granted_by: session.profile.id,
      })),
    );
  }

  await sendPasswordSetupEmail(authUser.user.id, parsed.data.email, session.profile.id);

  await logAction({
    userId: session.profile.id,
    action: "user.created",
    resourceType: "profile",
    resourceId: authUser.user.id,
    metadata: { email: parsed.data.email },
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

export async function requestPasswordResetAction(userId: string, type: "setup" | "reset") {
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

  await sendPasswordSetupEmail(userId, profile.email, session.profile.id, type);

  await logAction({
    userId: session.profile.id,
    action: type === "setup" ? "auth.password.setup.requested" : "auth.password.reset.requested",
    resourceType: "profile",
    resourceId: userId,
  });

  revalidatePath("/configuracoes/usuarios");
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

async function sendPasswordSetupEmail(
  userId: string,
  email: string,
  requestedBy: string,
  type: "setup" | "reset" = "setup",
) {
  const admin = createAdminClient();
  const token = generateToken();
  const tokenHash = hashToken(token);

  await admin.from("password_reset_tokens").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: getTokenExpiry().toISOString(),
    requested_by: requestedBy,
  });

  const link = buildPasswordLink(token, type === "setup" ? "cadastrar" : "trocar");
  const emailType = type === "setup" ? "password_setup" : "password_reset";

  try {
    // Supabase Auth invite/reset can be wired when SMTP is configured
    await admin.from("email_logs").insert({
      recipient: email,
      subject: type === "setup" ? "Cadastro de senha" : "Troca de senha",
      type: emailType,
      status: "sent",
      related_user_id: userId,
      sent_at: new Date().toISOString(),
    });
  } catch (err) {
    await admin.from("email_logs").insert({
      recipient: email,
      subject: type === "setup" ? "Cadastro de senha" : "Troca de senha",
      type: emailType,
      status: "failed",
      error_message: err instanceof Error ? err.message : "unknown",
      related_user_id: userId,
    });
  }
}
