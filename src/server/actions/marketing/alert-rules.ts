"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { marketingSchema } from "@/lib/supabase/marketing";
import { requireAuth } from "@/lib/auth/session";
import { hasMinRole } from "@/lib/auth/permissions";
import { logAction } from "@/lib/auth/audit";
import {
  createAlertRuleSchema,
  toggleAlertRuleSchema,
  updateAlertRuleSchema,
  type CreateAlertRuleInput,
  type UpdateAlertRuleInput,
} from "@/lib/validations/marketing/alert-rules";

const DASHBOARD_PATH = "/dashboards/marketing";

type RuleData = ReturnType<typeof createAlertRuleSchema.parse>;

/** Monta o payload do banco, zerando campos que não pertencem ao tipo da regra. */
function toRow(data: RuleData) {
  const isPerf = data.rule_type === "performance";
  return {
    name: data.name,
    rule_type: data.rule_type,
    severity: data.severity,
    is_active: data.is_active,
    source: isPerf ? (data.source ?? null) : null,
    metric: isPerf ? (data.metric ?? null) : null,
    direction: isPerf ? (data.direction ?? "any") : null,
    threshold_pct: isPerf ? (data.threshold_pct ?? null) : null,
    period_window: isPerf ? (data.period_window ?? "day") : null,
    event_date: !isPerf ? data.event_date || null : null,
    remind_days_before: !isPerf ? (data.remind_days_before ?? 7) : null,
  };
}

async function requireGestor() {
  const session = await requireAuth();
  if (!hasMinRole(session.profile, "gestor")) {
    return { session: null, error: "Apenas gestor+ pode configurar regras de alerta" };
  }
  return { session, error: null };
}

export async function createAlertRuleAction(input: CreateAlertRuleInput) {
  const { session, error } = await requireGestor();
  if (error) return { error };

  const data = createAlertRuleSchema.parse(input);
  const supabase = await createClient();
  const { data: rule, error: dbError } = await marketingSchema(supabase)
    .from("alert_rules")
    .insert({ ...toRow(data), created_by: session!.user.id })
    .select()
    .single();

  if (dbError) return { error: dbError.message };

  await logAction({
    userId: session!.user.id,
    action: "mkt.alert_rule.created",
    resourceType: "marketing.alert_rule",
    resourceId: (rule as { id: string }).id,
    metadata: { rule_type: data.rule_type, name: data.name },
  });

  revalidatePath(DASHBOARD_PATH);
  return { data: rule };
}

export async function updateAlertRuleAction(input: UpdateAlertRuleInput) {
  const { session, error } = await requireGestor();
  if (error) return { error };

  const data = updateAlertRuleSchema.parse(input);
  const supabase = await createClient();
  const { error: dbError } = await marketingSchema(supabase)
    .from("alert_rules")
    .update(toRow(data))
    .eq("id", data.id);

  if (dbError) return { error: dbError.message };

  await logAction({
    userId: session!.user.id,
    action: "mkt.alert_rule.updated",
    resourceType: "marketing.alert_rule",
    resourceId: data.id,
    metadata: { rule_type: data.rule_type, name: data.name },
  });

  revalidatePath(DASHBOARD_PATH);
  return { ok: true };
}

export async function toggleAlertRuleAction(input: { id: string; is_active: boolean }) {
  const { session, error } = await requireGestor();
  if (error) return { error };

  const data = toggleAlertRuleSchema.parse(input);
  const supabase = await createClient();
  const { error: dbError } = await marketingSchema(supabase)
    .from("alert_rules")
    .update({ is_active: data.is_active })
    .eq("id", data.id);

  if (dbError) return { error: dbError.message };

  await logAction({
    userId: session!.user.id,
    action: "mkt.alert_rule.updated",
    resourceType: "marketing.alert_rule",
    resourceId: data.id,
    metadata: { is_active: data.is_active },
  });

  revalidatePath(DASHBOARD_PATH);
  return { ok: true };
}

export async function deleteAlertRuleAction(id: string) {
  const { session, error } = await requireGestor();
  if (error) return { error };

  const supabase = await createClient();
  const { error: dbError } = await marketingSchema(supabase)
    .from("alert_rules")
    .delete()
    .eq("id", id);

  if (dbError) return { error: dbError.message };

  await logAction({
    userId: session!.user.id,
    action: "mkt.alert_rule.deleted",
    resourceType: "marketing.alert_rule",
    resourceId: id,
  });

  revalidatePath(DASHBOARD_PATH);
  return { ok: true };
}
