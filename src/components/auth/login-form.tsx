"use client";

import { useState } from "react";
import Image from "next/image";
import { loginAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await loginAction(formData);
    if (result?.error && "form" in result.error && result.error.form) {
      setError(result.error.form[0]);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Image
          src="/imbil-logo.svg"
          alt="Imbil"
          width={160}
          height={48}
          className="mx-auto mb-4 h-12 w-auto"
        />
        <CardTitle>Acessar plataforma</CardTitle>
        <CardDescription>Entre com seu e-mail corporativo</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-primary hover:underline"
          onClick={() => setShowForgot(!showForgot)}
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
