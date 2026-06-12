"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LEAD_QUALIFICATIONS,
  LEAD_QUALIFICATION_LABELS,
  LEAD_SOURCE_LABELS,
} from "@/lib/constants/marketing-events";
import {
  forwardLeadToSalesAction,
  qualifyLeadAction,
} from "@/server/actions/marketing/leads";
import type { EventLeadWithRelations, LeadQualification } from "@/types/marketing-events";

const QUALIFICATION_BADGE: Record<
  LeadQualification,
  "destructive" | "warning" | "muted" | "secondary"
> = {
  quente: "destructive",
  morno: "warning",
  frio: "muted",
  nao_qualificado: "secondary",
};

export function LeadsTable({ leads }: { leads: EventLeadWithRelations[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [detail, setDetail] = useState<EventLeadWithRelations | null>(null);

  function qualify(lead: EventLeadWithRelations, qualification: string) {
    if (!qualification) return;
    startTransition(async () => {
      const res = await qualifyLeadAction({
        id: lead.id,
        qualification: qualification as LeadQualification,
      });
      if (res.error) {
        toast.error(typeof res.error === "string" ? res.error : "Erro ao qualificar");
        return;
      }
      toast.success("Lead qualificado.");
      router.refresh();
    });
  }

  function toggleForward(lead: EventLeadWithRelations) {
    startTransition(async () => {
      const res = await forwardLeadToSalesAction(lead.id, !lead.forwarded_to_sales);
      if (res.error) {
        toast.error(res.error);
        return;
      }
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
              <th className="px-3 py-2">Formulário</th>
              <th className="px-3 py-2">Contato</th>
              <th className="px-3 py-2">Interesse</th>
              <th className="px-3 py-2">Origem</th>
              <th className="px-3 py-2">Consent.</th>
              <th className="px-3 py-2">Qualificação</th>
              <th className="px-3 py-2">Encaminhado</th>
              <th className="px-3 py-2">Capturado em</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum lead encontrado com os filtros atuais.
                </td>
              </tr>
            )}
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => setDetail(lead)}
                  >
                    <span className="font-medium underline-offset-2 hover:underline">
                      {lead.full_name}
                    </span>
                    {lead.company && (
                      <span className="block text-xs text-muted-foreground">
                        {lead.company}
                      </span>
                    )}
                  </button>
                </td>
                <td className="px-3 py-2">
                  {lead.event ? (
                    <Link
                      href={`/modulos/marketing/eventos/leads?event=${lead.event.id}`}
                    >
                      <Badge variant="outline" className="hover:bg-accent">
                        {lead.event.name}
                      </Badge>
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2 text-xs">{lead.lead_form?.name ?? "Manual"}</td>
                <td className="px-3 py-2 text-xs">
                  {lead.email && <span className="block">{lead.email}</span>}
                  {lead.phone && <span className="block">{lead.phone}</span>}
                </td>
                <td className="px-3 py-2 text-xs">{lead.interest ?? "—"}</td>
                <td className="px-3 py-2">
                  <Badge variant="muted">{LEAD_SOURCE_LABELS[lead.source]}</Badge>
                </td>
                <td className="px-3 py-2">
                  {lead.marketing_consent ? (
                    <Badge variant="success">✓</Badge>
                  ) : (
                    <Badge variant="destructive" title="Sem consentimento mkt">
                      ✗
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-2">
                  <select
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    value={lead.qualification ?? ""}
                    disabled={pending}
                    onChange={(e) => qualify(lead, e.target.value)}
                  >
                    <option value="">—</option>
                    {LEAD_QUALIFICATIONS.map((q) => (
                      <option key={q} value={q}>
                        {LEAD_QUALIFICATION_LABELS[q]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={lead.forwarded_to_sales}
                    disabled={pending}
                    onChange={() => toggleForward(lead)}
                    aria-label="Encaminhado ao comercial"
                  />
                </td>
                <td className="px-3 py-2 text-xs">
                  {new Date(lead.created_at).toLocaleString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-xl">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.full_name}</DialogTitle>
                <DialogDescription>
                  {detail.event?.name}
                  {detail.lead_form
                    ? ` · ${detail.lead_form.name}`
                    : " · cadastro manual"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <Info label="E-mail" value={detail.email} />
                <Info label="Telefone" value={detail.phone} />
                <Info label="Empresa" value={detail.company} />
                <Info label="Cargo" value={detail.job_title} />
                <Info
                  label="Cidade/UF"
                  value={[detail.city, detail.state].filter(Boolean).join("/") || null}
                />
                <Info label="Interesse" value={detail.interest} />
                <div className="sm:col-span-2">
                  <Info label="Mensagem" value={detail.message} />
                </div>
              </div>

              {Object.keys(detail.custom_answers ?? {}).length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-semibold">Respostas customizadas</p>
                  <div className="space-y-1 text-sm">
                    {Object.entries(detail.custom_answers).map(([key, value]) => {
                      const field = detail.lead_form?.custom_fields?.find(
                        (f) => f.key === key,
                      );
                      return (
                        <p key={key}>
                          <span className="text-muted-foreground">
                            {field?.label ?? key}:
                          </span>{" "}
                          {value}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
                <p>
                  Capturado em {new Date(detail.created_at).toLocaleString("pt-BR")} ·{" "}
                  {LEAD_SOURCE_LABELS[detail.source]}
                </p>
                <p>
                  Consentimento marketing:{" "}
                  {detail.marketing_consent
                    ? `sim (${detail.marketing_consent_at ? new Date(detail.marketing_consent_at).toLocaleString("pt-BR") : ""}, versão ${detail.consent_text_version ?? "—"})`
                    : "não"}
                </p>
                {detail.qualification && (
                  <p>
                    Qualificação:{" "}
                    <Badge variant={QUALIFICATION_BADGE[detail.qualification]}>
                      {LEAD_QUALIFICATION_LABELS[detail.qualification]}
                    </Badge>{" "}
                    {detail.qualified_at &&
                      `em ${new Date(detail.qualified_at).toLocaleString("pt-BR")}`}
                  </p>
                )}
                {detail.qualification_notes && <p>Notas: {detail.qualification_notes}</p>}
                {detail.forwarded_to_sales && (
                  <p>
                    Encaminhado ao comercial
                    {detail.forwarded_at &&
                      ` em ${new Date(detail.forwarded_at).toLocaleString("pt-BR")}`}
                  </p>
                )}
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setDetail(null)}>
                  Fechar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <p>
      <span className="block text-xs text-muted-foreground">{label}</span>
      {value || "—"}
    </p>
  );
}
