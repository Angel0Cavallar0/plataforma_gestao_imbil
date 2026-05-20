"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { setPasswordFromSessionAction } from "@/server/actions/auth";
import { isPasswordValid } from "@/lib/auth/password-requirements";
import { PasswordRequirementsChecklist } from "@/components/auth/password-requirements-checklist";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PasswordFormProps {
  type: "cadastrar" | "trocar";
}

export function PasswordForm({ type }: PasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => isPasswordValid(password, confirmPassword),
    [password, confirmPassword],
  );

  const title = type === "cadastrar" ? "Cadastrar senha" : "Trocar senha";
  const subtitle =
    type === "cadastrar"
      ? "Defina sua senha de acesso à plataforma."
      : "Informe sua nova senha de acesso.";

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await setPasswordFromSessionAction(formData, type);
    if (!result?.error) return;
    if ("form" in result.error && result.error.form) setError(result.error.form[0]);
    else if ("password" in result.error && result.error.password)
      setError(result.error.password[0]);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="items-center space-y-4 text-center">
        <Image
          src="/imbil-logo.svg"
          alt="Imbil"
          width={180}
          height={54}
          priority
          className="h-12 w-auto"
        />
        <div className="space-y-1">
          <CardTitle className="text-xl">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <PasswordInput
              id="password"
              name="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <PasswordRequirementsChecklist
            password={password}
            confirmPassword={confirmPassword}
          />

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={!canSubmit}>
            Salvar senha
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
