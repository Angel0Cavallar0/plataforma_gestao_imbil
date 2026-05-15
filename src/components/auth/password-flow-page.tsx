"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PasswordForm } from "@/components/auth/password-form";

interface PasswordFlowPageProps {
  type: "cadastrar" | "trocar";
}

export function PasswordFlowPage({ type }: PasswordFlowPageProps) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setReady(true);
        setError(null);
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
        return;
      }

      window.setTimeout(() => {
        void supabase.auth.getSession().then(({ data: { session: retrySession } }) => {
          if (retrySession) {
            setReady(true);
          } else {
            setError(
              "Link expirado ou inválido. Solicite um novo convite ou redefinição de senha ao seu gestor.",
            );
          }
        });
      }, 400);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (error) {
    return (
      <p className="max-w-md text-center text-sm text-destructive" role="alert">
        {error}
      </p>
    );
  }

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Validando link de acesso…</p>;
  }

  return <PasswordForm type={type} />;
}
