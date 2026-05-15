"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  formatAuthHashError,
  getPasswordPathForAuthType,
  parseAuthHash,
} from "@/lib/auth/hash";
import { establishSessionFromAuthHash } from "@/lib/auth/session-from-hash";

function readHashError(): string | null {
  if (typeof window === "undefined") return null;
  const parsed = parseAuthHash(window.location.hash);
  if (!parsed?.error) return null;
  window.history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search,
  );
  return formatAuthHashError(parsed);
}

/**
 * Processa o fragmento (#access_token / #error) retornado pelo Supabase Auth
 * após o clique no e-mail. Evita perder o token quando o redirect cai na raiz ou no login.
 */
export function AuthHashHandler({ children }: { children: React.ReactNode }) {
  const [hashError] = useState(readHashError);

  useEffect(() => {
    const parsed = parseAuthHash(window.location.hash);
    if (!parsed?.accessToken) return;

    const targetPath = getPasswordPathForAuthType(parsed.type);
    if (window.location.pathname.startsWith(targetPath)) {
      void establishSessionFromAuthHash(createClient());
      return;
    }

    window.location.replace(`${targetPath}${window.location.hash}`);
  }, []);

  return (
    <>
      {hashError && (
        <p
          className="mb-4 max-w-md rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive"
          role="alert"
        >
          {hashError}
        </p>
      )}
      {children}
    </>
  );
}
