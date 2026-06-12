"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { marketingSchema } from "@/lib/supabase/marketing";
import { requireAuth } from "@/lib/auth/session";
import { requireMarketingPermission } from "@/lib/auth/marketing";
import { logAction } from "@/lib/auth/audit";
import { hasMinRole } from "@/lib/auth/permissions";
import { CONSENT_TEXT_VERSION } from "@/lib/constants/marketing-events";
import { getLeads } from "@/server/queries/marketing/events";
import {
  createLeadManualSchema,
  qualifyLeadSchema,
  type CreateLeadManualInput,
  type QualifyLeadInput,
} from "@/lib/validations/marketing/events";
import type { LeadFilters } from "@/types/marketing-events";

const LEADS_PATH = "/modulos/marketing/eventos/leads";

export async function createLeadManualAction(input: CreateLeadManualInput) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "create");
  const data = createLeadManualSchema.parse(input);
  const supabase = await createClient();

  const { data: lead, error } = await marketingSchema(supabase)
    .from("event_leads")
    .insert({
      ...data,
      email: data.email || null,
      phone: data.phone || null,
      source: "cadastro_manual",
      captured_by: session.user.id,
      consent_text_version: data.marketing_consent ? CONSENT_TEXT_VERSION : null,
    })
    .select()
    .single();
  if (error) return { error: error.message };

  await logAction({
    userId: session.user.id,
    action: "mkt.event_lead.created_manual",
    resourceType: "marketing.event_lead",
    resourceId: lead.id as string,
    metadata: { event_id: data.event_id, marketing_consent: data.marketing_consent },
  });
  revalidatePath(LEADS_PATH);
  return { data: lead };
}

export async function qualifyLeadAction(input: QualifyLeadInput) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "update");
  const data = qualifyLeadSchema.parse(input);
  const supabase = await createClient();

  const { error } = await marketingSchema(supabase)
    .from("event_leads")
    .update({
      qualification: data.qualification,
      qualification_notes: data.notes ?? null,
      qualified_by: session.user.id,
      qualified_at: new Date().toISOString(),
    })
    .eq("id", data.id);
  if (error) return { error: error.message };

  await logAction({
    userId: session.user.id,
    action: "mkt.event_lead.qualified",
    resourceType: "marketing.event_lead",
    resourceId: data.id,
    metadata: { qualification: data.qualification },
  });
  revalidatePath(LEADS_PATH);
  return { data: { id: data.id } };
}

export async function forwardLeadToSalesAction(leadId: string, forwarded: boolean) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "update");
  const supabase = await createClient();

  const { error } = await marketingSchema(supabase)
    .from("event_leads")
    .update({
      forwarded_to_sales: forwarded,
      forwarded_at: forwarded ? new Date().toISOString() : null,
    })
    .eq("id", leadId);
  if (error) return { error: error.message };

  await logAction({
    userId: session.user.id,
    action: "mkt.event_lead.forwarded",
    resourceType: "marketing.event_lead",
    resourceId: leadId,
    metadata: { forwarded },
  });
  revalidatePath(LEADS_PATH);
  return { data: { id: leadId } };
}

export async function deleteLeadAction(leadId: string) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "delete");
  if (!hasMinRole(session.profile, "gestor")) {
    return { error: "Excluir leads exige perfil gestor ou superior." };
  }
  const supabase = await createClient();

  const { error } = await marketingSchema(supabase)
    .from("event_leads")
    .delete()
    .eq("id", leadId);
  if (error) return { error: error.message };

  await logAction({
    userId: session.user.id,
    action: "mkt.event_lead.deleted",
    resourceType: "marketing.event_lead",
    resourceId: leadId,
  });
  revalidatePath(LEADS_PATH);
  return { data: { id: leadId } };
}

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Exporta leads em CSV respeitando a finalidade:
 * - operacional → todos os leads dos filtros
 * - marketing  → somente leads com marketing_consent = true (LGPD)
 */
export async function exportLeadsAction(
  filters: LeadFilters,
  purpose: "operacional" | "marketing",
) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "read");
  if (!hasMinRole(session.profile, "supervisao")) {
    return { error: "Exportar leads exige perfil supervisão ou superior." };
  }

  const effectiveFilters =
    purpose === "marketing" ? { ...filters, consent: "sim" } : filters;
  const leads = await getLeads(effectiveFilters);

  const header = [
    "nome",
    "empresa",
    "cargo",
    "email",
    "telefone",
    "cidade",
    "uf",
    "interesse",
    "mensagem",
    "evento",
    "formulario",
    "origem",
    "consentimento_marketing",
    "qualificacao",
    "encaminhado_comercial",
    "capturado_em",
  ];
  const rows = leads.map((l) =>
    [
      l.full_name,
      l.company,
      l.job_title,
      l.email,
      l.phone,
      l.city,
      l.state,
      l.interest,
      l.message,
      l.event?.name,
      l.lead_form?.name ?? "Manual",
      l.source,
      l.marketing_consent ? "sim" : "nao",
      l.qualification,
      l.forwarded_to_sales ? "sim" : "nao",
      l.created_at,
    ]
      .map(csvEscape)
      .join(","),
  );
  const csv = [header.join(","), ...rows].join("\n");

  await logAction({
    userId: session.user.id,
    action: "mkt.event_lead.exported",
    resourceType: "marketing.event_lead",
    metadata: { purpose, count: leads.length, filters: effectiveFilters },
  });

  return { data: { csv, count: leads.length } };
}
