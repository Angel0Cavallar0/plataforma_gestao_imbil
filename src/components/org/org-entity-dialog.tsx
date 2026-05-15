"use client";

import { useState } from "react";
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

interface SelectOption {
  id: string;
  label: string;
}

interface OrgEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  onSubmit: (formData: FormData) => Promise<{ error?: unknown; success?: boolean }>;
  fields: {
    hidden?: Record<string, string>;
    name?: { defaultValue?: string; label?: string };
    parentId?: { options: SelectOption[]; defaultValue?: string; label?: string };
    responsibleName?: { defaultValue?: string };
    responsibleId?: { options: SelectOption[]; defaultValue?: string };
    departmentId?: { options: SelectOption[]; defaultValue?: string; label?: string };
  };
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50";

export function OrgEntityDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  onSubmit,
  fields,
}: OrgEntityDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await onSubmit(formData);
      if (typeof result.error === "string") {
        setError(result.error);
      } else if (result.error) {
        setError("Verifique os campos.");
      } else {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!isSubmitting) {
      onOpenChange(next);
      if (!next) setError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.hidden &&
            Object.entries(fields.hidden).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={value} />
            ))}
          {fields.name && (
            <div className="space-y-1">
              <Label htmlFor="name">{fields.name.label ?? "Nome"}</Label>
              <Input
                id="name"
                name="name"
                required
                disabled={isSubmitting}
                defaultValue={fields.name.defaultValue}
              />
            </div>
          )}
          {fields.parentId && (
            <div className="space-y-1">
              <Label htmlFor="parent_id">{fields.parentId.label ?? "Setor"}</Label>
              <select
                id="parent_id"
                name="parent_id"
                required
                disabled={isSubmitting}
                defaultValue={fields.parentId.defaultValue ?? ""}
                className={selectClassName}
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {fields.parentId.options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {fields.departmentId && (
            <div className="space-y-1">
              <Label htmlFor="department_id">
                {fields.departmentId.label ?? "Departamento"}
              </Label>
              <select
                id="department_id"
                name="department_id"
                required
                disabled={isSubmitting}
                defaultValue={fields.departmentId.defaultValue ?? ""}
                className={selectClassName}
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {fields.departmentId.options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {fields.responsibleName !== undefined && (
            <div className="space-y-1">
              <Label htmlFor="responsible_name">Nome do responsável</Label>
              <Input
                id="responsible_name"
                name="responsible_name"
                disabled={isSubmitting}
                defaultValue={fields.responsibleName.defaultValue ?? ""}
                placeholder="Opcional"
              />
            </div>
          )}
          {fields.responsibleId && (
            <div className="space-y-1">
              <Label htmlFor="responsible_id">Vincular usuário responsável</Label>
              <select
                id="responsible_id"
                name="responsible_id"
                disabled={isSubmitting}
                defaultValue={fields.responsibleId.defaultValue ?? ""}
                className={selectClassName}
              >
                <option value="">Nenhum</option>
                {fields.responsibleId.options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
