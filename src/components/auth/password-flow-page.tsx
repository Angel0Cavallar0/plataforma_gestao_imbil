"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { establishSessionFromAuthHash } from "@/lib/auth/session-from-hash";
import { PasswordForm } from "@/components/auth/password-form";

interface PasswordFlowPageProps {
  type: "cadastrar" | "trocar";
}

export function PasswordFlowPage({ type }: PasswordFlowPageProps) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled && session) {
        setReady(true);
        setError(null);
      }
    });

    void establishSessionFromAuthHash(supabase).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setReady(true);
        setError(null);
      } else {
        setError(result.error);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
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
