"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { hasMinRole } from "@/lib/auth/permissions";
import { hasMarketingPermission } from "@/lib/auth/marketing";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/auth/audit";
import {
  reportPeriodSchema,
  reportScopeSchema,
  reportsWebhookUrlSchema,
} from "@/lib/validations/marketing/reports";
import {
  countTodayRequestsGlobal,
  getRemainingReportQuota,
  getReportsWebhookUrl,
} from "@/server/queries/marketing/reports-control";
import { DAILY_REPORT_LIMIT } from "@/lib/constants/marketing-insights";

export type RequestReportScope = "redes_sociais" | "midia_paga" | "midia_paga_insights";

export type RequestReportResult =
  | { ok: true; remaining: number; requestId: string }
  | {
      ok: false;
      reason:
        | "forbidden"
        | "invalid"
        | "daily_limit"
        | "not_configured"
        | "webhook_error";
      remaining?: number;
    };

/**
 * Dispara o webhook de geração de relatório (n8n) com validação de cota GLOBAL
 * e registro da solicitação. Seção 7/9.3. Toda a lógica (cota + webhook) roda
 * no servidor — nunca no client.
 */
export async function requestMarketingReport(
  scope: RequestReportScope,
  period?: { data_inicio: string; data_fim: string },
): Promise<RequestReportResult> {
  const session = await requireAuth();
  if (!(await hasMarketingPermission(session.user.id, "read"))) {
    return { ok: false, reason: "forbidden" };
  }

  const parsedScope = reportScopeSchema.safeParse(scope);
  if (!parsedScope.success) return { ok: false, reason: "invalid" };

  let parsedPeriod: { data_inicio: string; data_fim: string } | undefined;
  if (period) {
    const p = reportPeriodSchema.safeParse(period);
    if (!p.success) return { ok: false, reason: "invalid" };
    parsedPeriod = p.data;
  }

  // 1. Limite GLOBAL do dia (ignora falhas)
  const count = await countTodayRequestsGlobal();
  if (count >= DAILY_REPORT_LIMIT) {
    return { ok: false, reason: "daily_limit", remaining: 0 };
  }

  // 2. URL do webhook em module_settings
  const url = await getReportsWebhookUrl();
  if (!url) return { ok: false, reason: "not_configured" };

  const admin = createAdminClient();

  // 3. Registra a solicitação (status 'requested' — já conta na cota)
  const { data: reqRow, error: insErr } = await admin
    .schema("marketing")
    .from("report_requests")
    .insert({
      requested_by: session.user.id,
      scope: parsedScope.data,
      data_inicio: parsedPeriod?.data_inicio ?? null,
      data_fim: parsedPeriod?.data_fim ?? null,
      status: "requested",
    })
    .select("id")
    .single();

  if (insErr || !reqRow) return { ok: false, reason: "webhook_error" };
  const requestId = (reqRow as { id: string }).id;

  // 4. Dispara o webhook (server-side). Não guardamos o corpo da resposta.
  try {
    const body = parsedPeriod
      ? { data_inicio: parsedPeriod.data_inicio, data_fim: parsedPeriod.data_fim }
      : {};
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`webhook respondeu ${res.status}`);
    await admin
      .schema("marketing")
      .from("report_requests")
      .update({ status: "webhook_sent" })
      .eq("id", requestId);
  } catch {
    // Falha não consome cota.
    await admin
      .schema("marketing")
      .from("report_requests")
      .update({ status: "failed" })
      .eq("id", requestId);
    return { ok: false, reason: "webhook_error" };
  }

  // 5. Log apenas do evento (não a resposta do webhook)
  await logAction({
    userId: session.user.id,
    action: "mkt.report.requested",
    resourceType: "marketing.report_requests",
    resourceId: requestId,
    metadata: { scope: parsedScope.data, period: parsedPeriod ?? null },
  });

  return { ok: true, remaining: DAILY_REPORT_LIMIT - (count + 1), requestId };
}

/** Solicitações restantes hoje (global) — para atualizar o contador na UI. */
export async function getReportQuotaRemaining(): Promise<number> {
  const session = await requireAuth();
  if (!(await hasMarketingPermission(session.user.id, "read"))) return 0;
  return getRemainingReportQuota();
}

/**
 * Marca a solicitação aberta mais recente como concluída quando um novo
 * relatório chega (detectado via Realtime na página). Seção 10.3.
 */
export async function completeReportRequest(reportId: string): Promise<{ ok: boolean }> {
  const session = await requireAuth();
  if (!(await hasMarketingPermission(session.user.id, "read"))) {
    return { ok: false };
  }

  const admin = createAdminClient();
  const { data: open } = await admin
    .schema("marketing")
    .from("report_requests")
    .select("id")
    .in("status", ["webhook_sent", "requested"])
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const openId = (open as { id: string } | null)?.id;
  if (openId) {
    await admin
      .schema("marketing")
      .from("report_requests")
      .update({
        status: "completed",
        report_id: reportId,
        completed_at: new Date().toISOString(),
      })
      .eq("id", openId);

    await logAction({
      userId: session.user.id,
      action: "mkt.report.completed",
      resourceType: "marketing.report_requests",
      resourceId: openId,
      metadata: { report_id: reportId },
    });
  }

  return { ok: true };
}

/** Ping de teste do webhook (gestor+). Seção 9.2. */
export async function testReportsWebhook(): Promise<{
  ok: boolean;
  status?: number;
  error?: string;
}> {
  const session = await requireAuth();
  if (!hasMinRole(session.profile, "gestor")) {
    return { ok: false, error: "Sem permissão" };
  }
  const url = await getReportsWebhookUrl();
  if (!url) return { ok: false, error: "Webhook não configurado" };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: true }),
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Falha na conexão" };
  }
}

/** Grava a URL do webhook em marketing.module_settings (gestor+). Seção 9. */
export async function saveReportsWebhookUrl(
  url: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireAuth();
  if (!hasMinRole(session.profile, "gestor")) {
    return { ok: false, error: "Apenas gestor+ pode configurar o webhook" };
  }

  const parsed = reportsWebhookUrlSchema.safeParse(url);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "URL inválida" };
  }

  const admin = createAdminClient();
  const { error } = await admin.schema("marketing").from("module_settings").upsert(
    {
      key: "reports_webhook_url",
      value: parsed.data,
      description: "URL do webhook do n8n que gera os relatórios de marketing",
      updated_by: session.user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) return { ok: false, error: error.message };

  await logAction({
    userId: session.user.id,
    action: "mkt.settings.webhook_updated",
    resourceType: "marketing.module_settings",
    resourceId: "reports_webhook_url",
    metadata: { url: parsed.data },
  });

  revalidatePath("/configuracoes/modulos/marketing/relatorios");
  return { ok: true };
}
