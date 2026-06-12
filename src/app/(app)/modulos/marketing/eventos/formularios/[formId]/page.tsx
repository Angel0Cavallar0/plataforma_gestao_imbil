import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FormExpirationBadge } from "@/components/marketing/events/forms/FormExpirationBadge";
import { FormPublicLink } from "@/components/marketing/events/forms/FormPublicLink";
import { LeadsTable } from "@/components/marketing/events/leads/LeadsTable";
import {
  CUSTOM_FIELD_TYPE_LABELS,
  STANDARD_FIELD_LABELS,
} from "@/lib/constants/marketing-events";
import { leadFormStatus } from "@/lib/marketing/lead-form-status";
import { getLeadFormById, getLeads } from "@/server/queries/marketing/events";

const STATUS_BADGE = {
  ativo: <Badge variant="success">Ativo</Badge>,
  inativo: <Badge variant="muted">Inativo</Badge>,
  expirado: <Badge variant="destructive">Expirado</Badge>,
};

export default async function FormularioDetalhePage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const form = await getLeadFormById(formId);
  if (!form) notFound();

  const leads = await getLeads({ form: formId });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/modulos/marketing/eventos/formularios"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Formulários
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{form.name}</h1>
            {STATUS_BADGE[leadFormStatus(form)]}
            <FormExpirationBadge expiresAt={form.expires_at} />
          </div>
          <p className="text-sm text-muted-foreground">
            {form.event ? (
              <Link
                href={`/modulos/marketing/eventos/${form.event.id}`}
                className="hover:underline"
              >
                {form.event.name}
                {form.event.edition ? ` · ${form.event.edition}` : ""}
              </Link>
            ) : (
              "Sem evento vinculado"
            )}
          </p>
        </div>
        <Link
          href={`/modulos/marketing/eventos/formularios/${form.id}/editar`}
          className={cn(buttonVariants())}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Editar formulário
        </Link>
      </div>

      {form.description && (
        <p className="text-sm text-muted-foreground">{form.description}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Campos do formulário</h2>
          <ul className="space-y-1 rounded-lg border bg-muted/30 p-4 text-sm">
            <li className="text-muted-foreground">Nome completo (fixo)</li>
            <li className="text-muted-foreground">
              E-mail / Telefone (fixo, pelo menos um)
            </li>
            {form.standard_fields.map((key) => (
              <li key={key}>{STANDARD_FIELD_LABELS[key]}</li>
            ))}
            {[...form.custom_fields]
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
          {form.interest_options.length > 0 && (
            <div className="text-sm">
              <p className="mb-1 font-medium">Opções de área de interesse</p>
              <div className="flex flex-wrap gap-1.5">
                {form.interest_options.map((opt) => (
                  <Badge key={opt} variant="outline">
                    {opt}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </section>

        <FormPublicLink formId={form.id} slug={form.slug} token={form.public_token} />
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">
            Leads capturados{" "}
            <span className="text-muted-foreground">({leads.length})</span>
          </h2>
          {leads.length > 0 && (
            <Link
              href={`/modulos/marketing/eventos/leads?event=${form.event_id}&form=${form.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Abrir na página de Leads
            </Link>
          )}
        </div>
        {leads.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhum lead capturado por este formulário ainda. Os dados preenchidos no link
            público aparecem aqui automaticamente.
          </p>
        ) : (
          <LeadsTable leads={leads} />
        )}
      </section>
    </div>
  );
}
