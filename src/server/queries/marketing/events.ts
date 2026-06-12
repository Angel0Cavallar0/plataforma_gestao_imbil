import { createClient } from "@/lib/supabase/server";
import { marketingSchema } from "@/lib/supabase/marketing";
import { getQrSignedUrl } from "@/lib/marketing/form-qrcode";
import type {
  CustomField,
  EventCost,
  EventKanbanCardData,
  EventLeadWithRelations,
  EventRoiRow,
  EventStatusHistoryEntry,
  LeadFilters,
  LeadFormWithEvent,
  LeadKpis,
  MarketingEvent,
} from "@/types/marketing-events";

function one<T>(value: unknown): T | null {
  return (Array.isArray(value) ? value[0] : value) as T | null;
}

export async function getEventsForKanban(): Promise<EventKanbanCardData[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("events")
    .select(
      "*, event_leads(count), lead_forms(is_active, expires_at), event_costs(amount)",
    )
    .order("kanban_order");
  if (error) throw error;

  const now = Date.now();
  return (data ?? []).map((row) => {
    const leads = row.event_leads as unknown as { count: number }[] | null;
    const forms = row.lead_forms as unknown as
      | { is_active: boolean; expires_at: string }[]
      | null;
    const costs = row.event_costs as unknown as { amount: number }[] | null;
    const { event_leads, lead_forms, event_costs, ...event } = row as unknown as Record<
      string,
      unknown
    >;
    void event_leads;
    void lead_forms;
    void event_costs;
    return {
      ...(event as unknown as MarketingEvent),
      leads_count: leads?.[0]?.count ?? 0,
      active_forms_count: (forms ?? []).filter(
        (f) => f.is_active && new Date(f.expires_at).getTime() > now,
      ).length,
      costs_total: (costs ?? []).reduce((sum, c) => sum + Number(c.amount ?? 0), 0),
    };
  });
}

export async function getEventById(eventId: string): Promise<MarketingEvent | null> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  if (error) throw error;
  return data as MarketingEvent | null;
}

export async function getEventCosts(eventId: string): Promise<EventCost[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("event_costs")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EventCost[];
}

export async function getEventStatusHistory(
  eventId: string,
): Promise<EventStatusHistoryEntry[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("event_status_history")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const entries = (data ?? []) as EventStatusHistoryEntry[];

  // Nomes dos autores (profiles está no schema public — busca separada)
  const userIds = [...new Set(entries.map((e) => e.changed_by).filter(Boolean))];
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds as string[]);
    const byId = new Map((profiles ?? []).map((p) => [p.id, p.full_name as string]));
    for (const e of entries) {
      e.changed_by_profile = e.changed_by
        ? { full_name: byId.get(e.changed_by) ?? "—" }
        : null;
    }
  }
  return entries;
}

export type EventSelectOption = {
  id: string;
  name: string;
  edition: string | null;
  ends_on: string | null;
};

export async function getEventsForSelect(): Promise<EventSelectOption[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("events")
    .select("id, name, edition, ends_on")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EventSelectOption[];
}

export async function getLeadForms(filters?: {
  eventId?: string;
}): Promise<LeadFormWithEvent[]> {
  const supabase = await createClient();
  let q = marketingSchema(supabase)
    .from("lead_forms")
    .select("*, event:events(id, name, edition)");
  if (filters?.eventId) q = q.eq("event_id", filters.eventId);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...(row as unknown as LeadFormWithEvent),
    event: one(row.event),
  }));
}

export async function getLeadFormById(formId: string): Promise<LeadFormWithEvent | null> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("lead_forms")
    .select("*, event:events(id, name, edition)")
    .eq("id", formId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...(data as unknown as LeadFormWithEvent), event: one(data.event) };
}

export async function getFormQrUrl(qrCodePath: string | null): Promise<string | null> {
  return getQrSignedUrl(qrCodePath);
}

export async function getLeads(filters: LeadFilters): Promise<EventLeadWithRelations[]> {
  const supabase = await createClient();
  let q = marketingSchema(supabase)
    .from("event_leads")
    .select(
      "*, event:events(id, name, edition), lead_form:lead_forms(id, name, custom_fields)",
    );

  if (filters.event) q = q.eq("event_id", filters.event);
  if (filters.form) q = q.eq("lead_form_id", filters.form);
  if (filters.qualification) q = q.eq("qualification", filters.qualification);
  if (filters.source) q = q.eq("source", filters.source);
  if (filters.consent === "sim") q = q.eq("marketing_consent", true);
  if (filters.consent === "nao") q = q.eq("marketing_consent", false);
  if (filters.from) q = q.gte("created_at", filters.from);
  if (filters.to) q = q.lte("created_at", filters.to);
  if (filters.q) {
    const term = filters.q.replace(/[%,()]/g, "");
    q = q.or(`full_name.ilike.%${term}%,company.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const { data, error } = await q.order("created_at", { ascending: false }).limit(500);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...(row as unknown as EventLeadWithRelations),
    event: one(row.event),
    lead_form: one<{ id: string; name: string; custom_fields: CustomField[] }>(
      row.lead_form,
    ),
  }));
}

export async function getLeadKpis(filters: LeadFilters): Promise<LeadKpis> {
  const leads = await getLeads(filters);
  const total = leads.length;
  const qualified = leads.filter(
    (l) => l.qualification === "quente" || l.qualification === "morno",
  ).length;
  const withConsent = leads.filter((l) => l.marketing_consent).length;
  return {
    total,
    qualified,
    consentRate: total ? Math.round((withConsent / total) * 100) : 0,
    forwarded: leads.filter((l) => l.forwarded_to_sales).length,
  };
}

export async function getEventsRoi(): Promise<EventRoiRow[]> {
  const supabase = await createClient();
  const { data, error } = await marketingSchema(supabase)
    .from("v_events_roi")
    .select("*")
    .order("starts_on", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...(row as unknown as EventRoiRow),
    investment: row.investment === null ? null : Number(row.investment),
    leads_total: Number(row.leads_total ?? 0),
    leads_qualified: Number(row.leads_qualified ?? 0),
    leads_with_consent: Number(row.leads_with_consent ?? 0),
    leads_forwarded: Number(row.leads_forwarded ?? 0),
    estimated_value_per_lead:
      row.estimated_value_per_lead === null ? null : Number(row.estimated_value_per_lead),
    roi_estimated_pct:
      row.roi_estimated_pct === null ? null : Number(row.roi_estimated_pct),
  }));
}
