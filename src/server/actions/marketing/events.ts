"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { marketingSchema } from "@/lib/supabase/marketing";
import { requireAuth } from "@/lib/auth/session";
import { requireMarketingPermission } from "@/lib/auth/marketing";
import { logAction } from "@/lib/auth/audit";
import { hasMinRole } from "@/lib/auth/permissions";
import { EVENT_STATUS_TRANSITIONS } from "@/lib/constants/marketing-events";
import {
  addEventCostSchema,
  changeEventStatusSchema,
  createEventSchema,
  reorderKanbanSchema,
  updateEventSchema,
  type AddEventCostInput,
  type CreateEventInput,
  type UpdateEventInput,
} from "@/lib/validations/marketing/events";
import type { EventStatus } from "@/types/marketing-events";

const EVENTS_PATH = "/modulos/marketing/eventos";

function toDateString(d?: Date): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

export async function createEventAction(input: CreateEventInput) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "create");
  const data = createEventSchema.parse(input);
  const supabase = await createClient();

  const { data: event, error } = await marketingSchema(supabase)
    .from("events")
    .insert({
      ...data,
      starts_on: toDateString(data.starts_on),
      ends_on: toDateString(data.ends_on),
      created_by: session.user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await logAction({
    userId: session.user.id,
    action: "mkt.event.created",
    resourceType: "marketing.event",
    resourceId: event.id as string,
    metadata: { name: data.name },
  });
  revalidatePath(EVENTS_PATH);
  return { data: event };
}

export async function updateEventAction(input: UpdateEventInput) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "update");
  const { id, ...data } = updateEventSchema.parse(input);
  const supabase = await createClient();

  const { error } = await marketingSchema(supabase)
    .from("events")
    .update({
      ...data,
      ...(data.starts_on !== undefined
        ? { starts_on: toDateString(data.starts_on) }
        : {}),
      ...(data.ends_on !== undefined ? { ends_on: toDateString(data.ends_on) } : {}),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAction({
    userId: session.user.id,
    action: "mkt.event.updated",
    resourceType: "marketing.event",
    resourceId: id,
  });
  revalidatePath(EVENTS_PATH);
  revalidatePath(`${EVENTS_PATH}/${id}`);
  return { data: { id } };
}

export async function deleteEventAction(eventId: string) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "delete");
  if (!hasMinRole(session.profile, "gestor")) {
    return { error: "Excluir eventos exige perfil gestor ou superior." };
  }
  const supabase = await createClient();

  const { error } = await marketingSchema(supabase)
    .from("events")
    .delete()
    .eq("id", eventId);
  if (error) return { error: error.message };

  await logAction({
    userId: session.user.id,
    action: "mkt.event.deleted",
    resourceType: "marketing.event",
    resourceId: eventId,
  });
  revalidatePath(EVENTS_PATH);
  return { data: { id: eventId } };
}

export async function changeEventStatusAction(input: {
  id: string;
  to_status: EventStatus;
}) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "update");
  const { id, to_status } = changeEventStatusSchema.parse(input);
  const supabase = await createClient();

  const { data: current, error: fetchError } = await marketingSchema(supabase)
    .from("events")
    .select("status")
    .eq("id", id)
    .single();
  if (fetchError) return { error: fetchError.message };

  const from = current.status as EventStatus;
  if (!EVENT_STATUS_TRANSITIONS[from].includes(to_status)) {
    return {
      error: `Transição inválida: um evento em "${from}" não pode ir para "${to_status}".`,
    };
  }

  const { error } = await marketingSchema(supabase)
    .from("events")
    .update({ status: to_status })
    .eq("id", id);
  if (error) return { error: error.message };

  await logAction({
    userId: session.user.id,
    action: "mkt.event.status_changed",
    resourceType: "marketing.event",
    resourceId: id,
    metadata: { from_status: from, to_status },
  });
  revalidatePath(EVENTS_PATH);
  revalidatePath(`${EVENTS_PATH}/${id}`);
  return { data: { id, status: to_status } };
}

export async function reorderKanbanAction(input: {
  id: string;
  status: EventStatus;
  new_order: number;
}) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "update");
  const { id, status, new_order } = reorderKanbanSchema.parse(input);
  const supabase = await createClient();

  const { error } = await marketingSchema(supabase)
    .from("events")
    .update({ kanban_order: new_order })
    .eq("id", id)
    .eq("status", status);
  if (error) return { error: error.message };

  revalidatePath(EVENTS_PATH);
  return { data: { id } };
}

export async function addEventCostAction(input: AddEventCostInput) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "create");
  const data = addEventCostSchema.parse(input);
  const supabase = await createClient();

  const { data: cost, error } = await marketingSchema(supabase)
    .from("event_costs")
    .insert({
      ...data,
      paid_at: toDateString(data.paid_at),
      created_by: session.user.id,
    })
    .select()
    .single();
  if (error) return { error: error.message };

  await logAction({
    userId: session.user.id,
    action: "mkt.event_cost.added",
    resourceType: "marketing.event_cost",
    resourceId: cost.id as string,
    metadata: { event_id: data.event_id, category: data.category, amount: data.amount },
  });
  revalidatePath(`${EVENTS_PATH}/${data.event_id}`);
  return { data: cost };
}

export async function deleteEventCostAction(costId: string, eventId: string) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "delete");
  const supabase = await createClient();

  const { error } = await marketingSchema(supabase)
    .from("event_costs")
    .delete()
    .eq("id", costId);
  if (error) return { error: error.message };

  await logAction({
    userId: session.user.id,
    action: "mkt.event_cost.removed",
    resourceType: "marketing.event_cost",
    resourceId: costId,
    metadata: { event_id: eventId },
  });
  revalidatePath(`${EVENTS_PATH}/${eventId}`);
  return { data: { id: costId } };
}
