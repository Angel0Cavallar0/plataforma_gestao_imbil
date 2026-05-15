"use client";

import { useState } from "react";
import { setPasswordFromTokenAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PasswordFormProps {
  token: string;
  type: "cadastrar" | "trocar";
}

export function PasswordForm({ token, type }: PasswordFormProps) {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await setPasswordFromTokenAction(token, formData, type);
    if (!result?.error) return;
    if ("form" in result.error && result.error.form) setError(result.error.form[0]);
    else if ("password" in result.error && result.error.password)
      setError(result.error.password[0]);
  }

  const title = type === "cadastrar" ? "Cadastrar senha" : "Trocar senha";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Mínimo 12 caracteres com maiúsculas, minúsculas, números e especiais. Validade do
          link: 30 minutos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">
            Salvar senha
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
