"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type IntegrationField = {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "password" | "textarea";
  hint?: string;
};

/** Resultado esperado das ações de salvar/remover (compatível com as actions). */
type ActionOutcome = { error?: string } | { success?: boolean } | void;

export type IntegrationAccountCardProps = {
  title: string;
  /** Cor do "dot" ao lado do título (opcional). */
  color?: string;
  description?: string;
  configured: boolean;
  /** Badge exibido quando configured (ex.: "Conectada"). */
  statusLabel?: string;
  /** Resumo (label/valor) exibido quando configured. */
  summary?: { label: string; value: string }[];
  /** Texto exibido quando não configurado. */
  emptyHint?: string;
  fields: IntegrationField[];
  defaultValues?: Record<string, string> | null;
  dialogTitle: string;
  dialogDescription?: string;
  addLabel?: string;
  editLabel?: string;
  successMessage?: string;
  onSave: (values: Record<string, string>) => Promise<ActionOutcome>;
  onRemove?: () => Promise<ActionOutcome>;
};

function hasError(res: ActionOutcome): res is { error: string } {
  return Boolean(res && "error" in res && res.error);
}

/**
 * Card de integração genérico (status + resumo + diálogo de formulário).
 * Reutilizável para qualquer tipo de conta — basta fornecer os `fields` e a
 * ação `onSave`. Assim, novas integrações entram sem alterar este componente.
 */
export function IntegrationAccountCard({
  title,
  color,
  description,
  configured,
  statusLabel,
  summary,
  emptyHint,
  fields,
  defaultValues,
  dialogTitle,
  dialogDescription,
  addLabel = "Adicionar conta",
  editLabel = "Editar conta",
  successMessage = "Salvo com sucesso.",
  onSave,
  onRemove,
}: IntegrationAccountCardProps) {
  const router = useRouter();
  const idPrefix = useId();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const values: Record<string, string> = {};
    for (const f of fields) values[f.name] = String(fd.get(f.name) ?? "").trim();

    startTransition(async () => {
      const res = await onSave(values);
      if (hasError(res)) {
        toast.error(res.error);
        return;
      }
      toast.success(successMessage);
      setOpen(false);
      router.refresh();
    });
  }

  function handleRemove() {
    if (!onRemove) return;
    startTransition(async () => {
      const res = await onRemove();
      if (hasError(res)) {
        toast.error(res.error);
        return;
      }
      toast.success("Conta removida.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          {color && (
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: color }}
            />
          )}
          {title}
          {configured && statusLabel && (
            <Badge variant="success" className="ml-auto">
              {statusLabel}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {description && <p className="text-xs text-muted-foreground">{description}</p>}

        {configured && summary && summary.length > 0 ? (
          <dl className="space-y-1 text-xs">
            {summary.map((s) => (
              <div key={s.label} className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{s.label}</dt>
                <dd className="truncate font-medium tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        ) : !configured && emptyHint ? (
          <p className="text-xs text-muted-foreground">{emptyHint}</p>
        ) : null}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
          >
            {configured ? (
              <>
                <Pencil className="h-4 w-4" /> {editLabel}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> {addLabel}
              </>
            )}
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              {dialogDescription && (
                <DialogDescription>{dialogDescription}</DialogDescription>
              )}
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((f) => {
                const fieldId = `${idPrefix}-${f.name}`;
                return (
                  <div key={f.name} className="space-y-1.5">
                    <Label htmlFor={fieldId}>{f.label}</Label>
                    {f.type === "textarea" ? (
                      <Textarea
                        id={fieldId}
                        name={f.name}
                        required={f.required}
                        rows={3}
                        placeholder={f.placeholder}
                        defaultValue={defaultValues?.[f.name] ?? ""}
                      />
                    ) : (
                      <Input
                        id={fieldId}
                        name={f.name}
                        type={f.type === "password" ? "password" : "text"}
                        required={f.required}
                        placeholder={f.placeholder}
                        defaultValue={defaultValues?.[f.name] ?? ""}
                      />
                    )}
                    {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
                  </div>
                );
              })}
              <div className="flex items-center justify-between gap-2 pt-2">
                {onRemove && configured ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleRemove}
                    disabled={pending}
                    className="text-destructive hover:text-destructive"
                  >
                    Remover
                  </Button>
                ) : (
                  <span />
                )}
                <Button type="submit" disabled={pending}>
                  Salvar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
