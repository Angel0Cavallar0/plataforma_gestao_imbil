"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/auth/audit";
import { loginSchema, passwordSchema } from "@/lib/validations/auth";
import { hashToken } from "@/lib/auth/password";
import {
  LOCKOUT_DURATION_MINUTES,
  MAX_LOCKOUT_CYCLES,
  MAX_LOGIN_ATTEMPTS,
} from "@/lib/constants";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function getRequestMeta() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip"),
    userAgent: h.get("user-agent"),
  };
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;
  const admin = createAdminClient();
  const meta = await getRequestMeta();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, status, email")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (profile) {
    const { data: lockout } = await admin
      .from("account_lockouts")
      .select("*")
      .eq("user_id", profile.id)
      .maybeSingle();

    if (lockout?.locked_until && new Date(lockout.locked_until) > new Date()) {
      await admin.from("login_attempts").insert({
        email,
        success: false,
        ip_address: meta.ip,
        user_agent: meta.userAgent,
        failure_reason: "account_locked",
      });
      return { error: { form: ["Conta bloqueada. Tente novamente mais tarde."] } };
    }

    if (profile.status === "bloqueado") {
      return {
        error: {
          form: [
            "Conta travada. Solicite desbloqueio a um supervisor ou gestor.",
          ],
        },
      };
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase(),
    password,
  });

  if (error || !data.user) {
    await admin.from("login_attempts").insert({
      email,
      success: false,
      ip_address: meta.ip,
      user_agent: meta.userAgent,
      failure_reason: error?.message ?? "invalid_credentials",
    });

    if (profile) {
      const { data: lockout } = await admin
        .from("account_lockouts")
        .select("*")
        .eq("user_id", profile.id)
        .maybeSingle();

      const attempts = (lockout?.attempt_count ?? 0) + 1;
      let lockedUntil: string | null = null;
      let lockoutCount = lockout?.lockout_count ?? 0;

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        lockedUntil = new Date(
          Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000,
        ).toISOString();
        lockoutCount += 1;
      }

      await admin.from("account_lockouts").upsert({
        user_id: profile.id,
        attempt_count: attempts >= MAX_LOGIN_ATTEMPTS ? 0 : attempts,
        locked_until: lockedUntil,
        lockout_count: lockoutCount,
        updated_at: new Date().toISOString(),
      });

      if (lockoutCount >= MAX_LOCKOUT_CYCLES) {
        await admin
          .from("profiles")
          .update({ status: "bloqueado" })
          .eq("id", profile.id);
      }
    }

    return { error: { form: ["E-mail ou senha inválidos."] } };
  }

  await admin.from("login_attempts").insert({
    email,
    success: true,
    ip_address: meta.ip,
    user_agent: meta.userAgent,
  });

  if (profile) {
    await admin.from("account_lockouts").upsert({
      user_id: profile.id,
      attempt_count: 0,
      locked_until: null,
      updated_at: new Date().toISOString(),
    });
    await admin
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", profile.id);
  }

  await logAction({
    userId: data.user.id,
    action: "auth.login.success",
    resourceType: "session",
    resourceId: data.user.id,
  });

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logoutAction() {
  const session = await (async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  })();

  const supabase = await createClient();
  await supabase.auth.signOut();

  if (session) {
    await logAction({
      userId: session.id,
      action: "auth.logout",
      resourceType: "session",
      resourceId: session.id,
    });
  }

  redirect("/login");
}

export async function setPasswordFromTokenAction(
  token: string,
  formData: FormData,
  type: "cadastrar" | "trocar",
) {
  const parsed = passwordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const admin = createAdminClient();
  const tokenHash = hashToken(token);

  const { data: tokenRow } = await admin
    .from("password_reset_tokens")
    .select("id, user_id")
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!tokenRow) {
    return {
      error: {
        form: [
          "Link expirado ou inválido. Solicite um novo link ao seu supervisor.",
        ],
      },
    };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id, email")
    .eq("id", tokenRow.user_id)
    .single();

  if (!profile) {
    return { error: { form: ["Usuário não encontrado."] } };
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(
    profile.id,
    { password: parsed.data.password },
  );

  if (updateError) {
    return { error: { form: [updateError.message] } };
  }

  await admin
    .from("password_reset_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenRow.id);

  await admin
    .from("profiles")
    .update({
      password_changed_at: new Date().toISOString(),
      must_change_password: false,
    })
    .eq("id", profile.id);

  await logAction({
    userId: profile.id,
    action: type === "cadastrar" ? "auth.password.setup" : "auth.password.reset",
    resourceType: "profile",
    resourceId: profile.id,
  });

  redirect("/login?success=password-set");
}
