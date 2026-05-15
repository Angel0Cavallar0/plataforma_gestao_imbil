import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type AdminClient = SupabaseClient<Database>;

export function getAppBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** URL de destino após o usuário clicar no link do e-mail do Supabase Auth. */
export function getPasswordFlowRedirectUrl(
  path: "/cadastrar-senha" | "/trocar-senha",
): string {
  return `${getAppBaseUrl()}${path}`;
}

type EmailResult = { ok: true; userId?: string } | { ok: false; error: string };

export async function sendInviteUserEmail(
  admin: AdminClient,
  email: string,
  metadata?: Record<string, unknown>,
): Promise<EmailResult> {
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email.toLowerCase(), {
    redirectTo: getPasswordFlowRedirectUrl("/cadastrar-senha"),
    data: metadata,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, userId: data.user?.id };
}

export async function sendRecoveryEmail(
  admin: AdminClient,
  email: string,
): Promise<EmailResult> {
  const { error } = await admin.auth.resetPasswordForEmail(email.toLowerCase(), {
    redirectTo: getPasswordFlowRedirectUrl("/trocar-senha"),
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function logAuthEmail(
  admin: AdminClient,
  params: {
    recipient: string;
    type: "password_setup" | "password_reset";
    status: "sent" | "failed";
    relatedUserId?: string;
    errorMessage?: string;
  },
) {
  const subject =
    params.type === "password_setup"
      ? "Convite — Plataforma IMBIL (Supabase Auth)"
      : "Redefinição de senha — Plataforma IMBIL (Supabase Auth)";

  await admin.from("email_logs").insert({
    recipient: params.recipient.toLowerCase(),
    subject,
    type: params.type,
    status: params.status,
    error_message: params.errorMessage ?? null,
    related_user_id: params.relatedUserId ?? null,
    sent_at: params.status === "sent" ? new Date().toISOString() : null,
  });
}
