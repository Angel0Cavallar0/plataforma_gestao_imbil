"use client";

import { useState } from "react";
import { createUserAction } from "@/server/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RoleOption {
  id: string;
  name: string;
  slug: string;
}

interface ModuleOption {
  id: string;
  name: string;
}

interface CreateUserFormProps {
  roles: RoleOption[];
  modules: ModuleOption[];
}

export function CreateUserForm({ roles, modules }: CreateUserFormProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Criar novo usuário</Button>;
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await createUserAction(formData);
    if (typeof result.error === "string") setError(result.error);
    else if (result.error) setError("Verifique os campos.");
    else setOpen(false);
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-4 rounded-lg border p-4 bg-card max-w-lg"
    >
      <h3 className="font-semibold">Novo usuário</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="full_name">Nome completo</Label>
          <Input id="full_name" name="full_name" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">E-mail corporativo</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="registration_number">Registro interno</Label>
          <Input id="registration_number" name="registration_number" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="role_id">Nível de perfil</Label>
          <select
            id="role_id"
            name="role_id"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Módulos (obrigatório para operação)</Label>
        <div className="flex flex-wrap gap-2">
          {modules.map((m) => (
            <label key={m.id} className="flex items-center gap-1 text-sm">
              <input type="checkbox" name="module_ids" value={m.id} />
              {m.name}
            </label>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit">Salvar</Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
