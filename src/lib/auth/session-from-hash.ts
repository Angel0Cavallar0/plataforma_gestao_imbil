import type { SupabaseClient } from "@supabase/supabase-js";
import { formatAuthHashError, parseAuthHash } from "@/lib/auth/hash";

export type EstablishSessionResult = { ok: true } | { ok: false; error: string };

/**
 * Converte #access_token do e-mail (fluxo invite/recovery sem PKCE) em sessão do Supabase.
 */
export async function establishSessionFromAuthHash(
  supabase: SupabaseClient,
): Promise<EstablishSessionResult> {
  const parsed = parseAuthHash(window.location.hash);

  if (parsed?.error) {
    return { ok: false, error: formatAuthHashError(parsed) };
  }

  if (parsed?.accessToken && parsed.refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: parsed.accessToken,
      refresh_token: parsed.refreshToken,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    window.history.replaceState(null, "", window.location.pathname);
    return { ok: true };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    return { ok: true };
  }

  if (parsed?.accessToken && !parsed.refreshToken) {
    return {
      ok: false,
      error: "Link incompleto. Solicite um novo convite ao seu gestor.",
    };
  }

  return {
    ok: false,
    error:
      "Link expirado ou inválido. Solicite um novo convite ou redefinição de senha ao seu gestor.",
  };
}
