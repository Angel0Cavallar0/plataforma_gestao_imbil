"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Power, QrCode, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  CUSTOM_FIELD_TYPE_LABELS,
  STANDARD_FIELD_LABELS,
  publicFormUrl,
} from "@/lib/constants/marketing-events";
import { leadFormStatus } from "@/lib/marketing/lead-form-status";
import {
  getFormQrDownloadUrlAction,
  rotateFormTokenAction,
  toggleLeadFormAction,
} from "@/server/actions/marketing/lead-forms";
import { FormExpirationBadge } from "./FormExpirationBadge";
import type { LeadFormWithEvent } from "@/types/marketing-events";

const STATUS_BADGE = {
  ativo: <Badge variant="success">Ativo</Badge>,
  inativo: <Badge variant="muted">Inativo</Badge>,
  expirado: <Badge variant="destructive">Expirado</Badge>,
};

export function LeadFormsTable({ forms }: { forms: LeadFormWithEvent[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rotateTarget, setRotateTarget] = useState<LeadFormWithEvent | null>(null);
  const [detailTarget, setDetailTarget] = useState<LeadFormWithEvent | null>(null);

  function copyLink(form: LeadFormWithEvent) {
    navigator.clipboard.writeText(publicFormUrl(form.slug, form.public_token));
    toast.success("Link copiado.");
  }

  function downloadQr(form: LeadFormWithEvent) {
    startTransition(async () => {
      const res = await getFormQrDownloadUrlAction(form.id);
      if (res.error || !res.data) {
        toast.error(res.error ?? "Erro ao gerar QR Code");
        return;
      }
      const a = document.createElement("a");
      a.href = res.data.url;
      a.download = `qrcode-${form.slug}.png`;
      a.click();
    });
  }

  function toggle(form: LeadFormWithEvent) {
    startTransition(async () => {
      const res = await toggleLeadFormAction(form.id, !form.is_active);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(form.is_active ? "Formulário desativado." : "Formulário ativado.");
      router.refresh();
    });
  }

  function confirmRotate() {
    if (!rotateTarget) return;
    const id = rotateTarget.id;
    setRotateTarget(null);
    startTransition(async () => {
      const res = await rotateFormTokenAction(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Token rotacionado. O QR Code foi regenerado com a nova URL.");
      router.refresh();
    });
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Evento</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Expira em</th>
              <th className="px-3 py-2 text-right">Inscrições</th>
              <th className="px-3 py-2">Última inscrição</th>
              <th className="px-3 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {forms.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum formulário criado.
                </td>
              </tr>
            )}
            {forms.map((form) => (
              <tr
                key={form.id}
                className="cursor-pointer border-t hover:bg-muted/30"
                onClick={() => setDetailTarget(form)}
              >
                <td className="px-3 py-2 font-medium underline-offset-2 hover:underline">
                  {form.name}
                </td>
                <td className="px-3 py-2">
                  {form.event ? (
                    <Link
                      href={`/modulos/marketing/eventos/${form.event.id}`}
                      className="inline-flex"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Badge variant="outline" className="hover:bg-accent">
                        {form.event.name}
                      </Badge>
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2">{STATUS_BADGE[leadFormStatus(form)]}</td>
                <td className="px-3 py-2">
                  <FormExpirationBadge expiresAt={form.expires_at} />
                </td>
                <td className="px-3 py-2 text-right">{form.submissions_count}</td>
                <td className="px-3 py-2">
                  {form.last_submission_at
                    ? new Date(form.last_submission_at).toLocaleString("pt-BR")
                    : "—"}
                </td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/modulos/marketing/eventos/formularios/${form.id}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Copiar link"
                      onClick={() => copyLink(form)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Baixar QR Code"
                      disabled={pending}
                      onClick={() => downloadQr(form)}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Rotacionar token"
                      disabled={pending}
                      onClick={() => setRotateTarget(form)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title={form.is_active ? "Desativar" : "Ativar"}
                      disabled={pending}
                      onClick={() => toggle(form)}
                    >
                      <Power
                        className={`h-4 w-4 ${form.is_active ? "text-green-600" : "text-muted-foreground"}`}
                      />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={!!detailTarget}
        onOpenChange={(open) => !open && setDetailTarget(null)}
      >
        <DialogContent className="max-w-xl">
          {detailTarget && (
            <>
              <DialogHeader>
                <DialogTitle>{detailTarget.name}</DialogTitle>
                <DialogDescription>
                  {detailTarget.event
                    ? `${detailTarget.event.name}${detailTarget.event.edition ? ` · ${detailTarget.event.edition}` : ""}`
                    : "Sem evento vinculado"}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-2">
                {STATUS_BADGE[leadFormStatus(detailTarget)]}
                <FormExpirationBadge expiresAt={detailTarget.expires_at} />
              </div>

              {detailTarget.description && (
                <p className="text-sm text-muted-foreground">
                  {detailTarget.description}
                </p>
              )}

              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                  Inscrições
                </p>
                {detailTarget.submissions_count > 0 ? (
                  <div className="space-y-1 text-sm">
                    <p>
                      <Badge variant="success">✓ Já há dados preenchidos</Badge>{" "}
                      <span className="font-medium">
                        {detailTarget.submissions_count}{" "}
                        {detailTarget.submissions_count > 1 ? "inscrições" : "inscrição"}
                      </span>
                    </p>
                    {detailTarget.last_submission_at && (
                      <p className="text-xs text-muted-foreground">
                        Última inscrição em{" "}
                        {new Date(detailTarget.last_submission_at).toLocaleString(
                          "pt-BR",
                        )}
                      </p>
                    )}
                    <Link
                      href={`/modulos/marketing/eventos/leads?event=${detailTarget.event_id}&form=${detailTarget.id}`}
                      className="inline-block text-sm font-medium text-primary hover:underline"
                    >
                      Ver inscrições →
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma inscrição ainda.
                  </p>
                )}
              </div>

              <div>
                <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                  Campos do formulário
                </p>
                <ul className="space-y-1 text-sm">
                  <li className="text-muted-foreground">Nome completo (fixo)</li>
                  <li className="text-muted-foreground">
                    E-mail / Telefone (fixo, pelo menos um)
                  </li>
                  {detailTarget.standard_fields.map((key) => (
                    <li key={key}>{STANDARD_FIELD_LABELS[key]}</li>
                  ))}
                  {[...detailTarget.custom_fields]
                    .sort((a, b) => a.order - b.order)
                    .map((field) => (
                      <li key={field.key}>
                        {field.label}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({CUSTOM_FIELD_TYPE_LABELS[field.type]}
                          {field.required ? ", obrigatório" : ""})
                        </span>
                      </li>
                    ))}
                  <li className="text-muted-foreground">
                    Consentimento LGPD (fixo, sempre por último)
                  </li>
                </ul>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                  Link público
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-md border bg-background px-2 py-1 text-xs">
                    {publicFormUrl(detailTarget.slug, detailTarget.public_token)}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    title="Copiar link"
                    onClick={() => copyLink(detailTarget)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDetailTarget(null)}>
                  Fechar
                </Button>
                <Link
                  href={`/modulos/marketing/eventos/formularios/${detailTarget.id}`}
                  className={cn(buttonVariants())}
                >
                  Editar formulário
                </Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!rotateTarget}
        onOpenChange={(open) => !open && setRotateTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rotacionar token público?</DialogTitle>
            <DialogDescription>
              O link atual e{" "}
              <strong>
                todos os QR Codes já impressos param de funcionar imediatamente
              </strong>
              . Um novo QR Code será gerado com a nova URL. Essa ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRotateTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmRotate}>
              Rotacionar token
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
