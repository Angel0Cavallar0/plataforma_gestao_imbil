"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { loginAction } from "@/server/actions/auth";
import { LoginSubmitButton } from "@/components/auth/login-submit-button";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginForm() {
  const searchParams = useSearchParams();
  const authError = searchParams.get("auth_error");
  const [error, setError] = useState<string | null>(authError);
  const [showForgot, setShowForgot] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await loginAction(formData);
      if (result?.error && "form" in result.error && result.error.form) {
        setError(result.error.form[0]);
        setIsSubmitting(false);
      }
    } catch {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="relative w-full max-w-md overflow-hidden">
      {isSubmitting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 backdrop-blur-sm">
          <LoadingScreen message="Autenticando..." compact />
        </div>
      )}
      <CardHeader className="text-center">
        <Image
          src="/imbil-logo.svg"
          alt="Imbil"
          width={180}
          height={54}
          priority
          className="mx-auto mb-4 h-12 w-auto"
        />
        <CardTitle>Acessar plataforma</CardTitle>
        <CardDescription>Entre com seu e-mail corporativo</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <PasswordInput
              id="password"
              name="password"
              required
              autoComplete="current-password"
              disabled={isSubmitting}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <LoginSubmitButton />
        </form>
        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-primary hover:underline disabled:opacity-50"
          onClick={() => setShowForgot(!showForgot)}
          disabled={isSubmitting}
        >
          Esqueci minha senha
        </button>
        {showForgot && (
          <p className="mt-2 rounded-md bg-muted p-3 text-xs text-muted-foreground">
            Não há recuperação pública de senha. Solicite a um usuário de{" "}
            <strong>supervisão ou superior</strong> que gere um novo link pelo painel de
            usuários.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
