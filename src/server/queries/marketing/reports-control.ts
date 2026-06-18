import { createAdminClient } from "@/lib/supabase/admin";
import { DAILY_REPORT_LIMIT } from "@/lib/constants/marketing-insights";

/**
 * Helpers de controle dos relatórios (leitura) usando o admin client.
 *
 * A URL do webhook é sensível (gestor+ via RLS), mas a Server Action de
 * disparo precisa lê-la para qualquer usuário com marketing.read — por isso
 * usamos o admin client server-side. O mesmo vale para a contagem de cota
 * (o INSERT/UPDATE de report_requests é feito via service role).
 */

/** Lê a URL do webhook de marketing.module_settings (string vazia = não configurado). */
export async function getReportsWebhookUrl(): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .schema("marketing")
    .from("module_settings")
    .select("value")
    .eq("key", "reports_webhook_url")
    .maybeSingle();
  if (error) throw error;
  const value = (data as { value?: unknown } | null)?.value;
  return typeof value === "string" ? value : "";
}

/** Início do dia atual no fuso de São Paulo (UTC-3), como instante ISO/UTC. */
export function spDayStartIso(): string {
  const spDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  // Brasil não usa horário de verão desde 2019 → São Paulo é UTC-3 o ano todo.
  return new Date(`${spDate}T00:00:00-03:00`).toISOString();
}

/**
 * Conta as solicitações de relatório do dia (GLOBAL, fuso SP), ignorando as
 * que falharam. Usado para validar o limite diário (Seção 8.2).
 */
export async function countTodayRequestsGlobal(): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .schema("marketing")
    .from("report_requests")
    .select("id", { count: "exact", head: true })
    .gte("requested_at", spDayStartIso())
    .in("status", ["requested", "webhook_sent", "completed"]);
  if (error) throw error;
  return count ?? 0;
}

/** Solicitações restantes hoje (global). */
export async function getRemainingReportQuota(): Promise<number> {
  const used = await countTodayRequestsGlobal();
  return Math.max(0, DAILY_REPORT_LIMIT - used);
}
