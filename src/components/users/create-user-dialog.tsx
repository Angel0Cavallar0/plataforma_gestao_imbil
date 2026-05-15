"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserAction } from "@/server/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RoleOption {
  id: string;
  name: string;
  slug: string;
}

interface ModuleOption {
  id: string;
  name: string;
}

interface CreateUserDialogProps {
  roles: RoleOption[];
  modules: ModuleOption[];
}

export function CreateUserDialog({ roles, modules }: CreateUserDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await createUserAction(formData);
      if (typeof result.error === "string") {
        setError(result.error);
      } else if (result.error) {
        setError("Verifique os campos.");
      } else {
        setOpen(false);
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!isSubmitting) {
      setOpen(nextOpen);
      if (!nextOpen) setError(null);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Criar novo usuário</Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para enviar o convite de cadastro por e-mail.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="full_name">Nome completo</Label>
                <Input id="full_name" name="full_name" required disabled={isSubmitting} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">E-mail corporativo</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="registration_number">Registro interno</Label>
                <Input
                  id="registration_number"
                  name="registration_number"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="role_id">Nível de perfil</Label>
                <select
                  id="role_id"
                  name="role_id"
                  required
                  disabled={isSubmitting}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
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
                    <input
                      type="checkbox"
                      name="module_ids"
                      value={m.id}
                      disabled={isSubmitting}
                    />
                    {m.name}
                  </label>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant={isSubmitting ? "secondary" : "default"}
                className={isSubmitting ? "opacity-60" : undefined}
              >
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
