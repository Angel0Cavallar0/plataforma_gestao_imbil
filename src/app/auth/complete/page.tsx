"use client";

import { useEffect } from "react";
import {
  formatAuthHashError,
  getPasswordPathForAuthType,
  parseAuthHash,
} from "@/lib/auth/hash";

/**
 * Página intermediária quando o Supabase redireciona para a raiz do site (Site URL)
 * em vez de /cadastrar-senha. Preserva o hash (#access_token) no cliente.
 */
export default function AuthCompletePage() {
  useEffect(() => {
    const parsed = parseAuthHash(window.location.hash);

    if (!parsed) {
      window.location.replace("/login");
      return;
    }

    if (parsed.error) {
      const message = encodeURIComponent(formatAuthHashError(parsed));
      window.location.replace(`/login?auth_error=${message}`);
      return;
    }

    if (parsed.accessToken) {
      const path = getPasswordPathForAuthType(parsed.type);
      window.location.replace(`${path}${window.location.hash}`);
      return;
    }

    window.location.replace("/login");
  }, []);

  return <p className="text-sm text-muted-foreground">Redirecionando…</p>;
}
