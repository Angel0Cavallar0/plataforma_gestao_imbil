import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/auth/audit";
import {
  PUBLIC_SUBMISSION_RATE_LIMIT,
  PUBLIC_SUBMISSION_RATE_WINDOW_MIN,
} from "@/lib/constants/marketing-events";
import { publicSubmissionSchema } from "@/lib/validations/marketing/events";
import type { CustomField, StandardFieldKey } from "@/types/marketing-events";

export const dynamic = "force-dynamic";

/**
 * Gravação pública de leads (formulários de captura em eventos).
 *
 * Sem policy de INSERT anônimo no banco: toda escrita passa por aqui, com
 * service_role restrito ao handler, após validar token + expiração +
 * rate limit + honeypot. Ver mkt_eventos Seção 7.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const parsed = publicSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Honeypot: bot preencheu o campo oculto → 200 fake, nada é gravado
  if (data.website && data.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const marketing = admin.schema("marketing");

  // Formulário: slug + token + ativo + não expirado
  const { data: form, error: formError } = await marketing
    .from("lead_forms")
    .select(
      "id, event_id, public_token, is_active, expires_at, custom_fields, standard_fields, interest_options, consent_text_version",
    )
    .eq("slug", data.slug)
    .maybeSingle();

  if (
    formError ||
    !form ||
    form.public_token !== data.token ||
    !form.is_active ||
    new Date(form.expires_at as string).getTime() <= Date.now()
  ) {
    return NextResponse.json({ error: "Formulário encerrado" }, { status: 404 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent");

  // Rate limit por IP (janela deslizante, contagem no próprio banco)
  if (ip) {
    const windowStart = new Date(
      Date.now() - PUBLIC_SUBMISSION_RATE_WINDOW_MIN * 60 * 1000,
    ).toISOString();
    const { count } = await marketing
      .from("event_leads")
      .select("id", { count: "exact", head: true })
      .eq("submitted_ip", ip)
      .gte("created_at", windowStart);
    if ((count ?? 0) >= PUBLIC_SUBMISSION_RATE_LIMIT) {
      return NextResponse.json(
        { error: "Muitos envios. Tente novamente em alguns minutos." },
        { status: 429 },
      );
    }
  }

  // Validação dinâmica das respostas customizadas contra o custom_fields
  const customFields = (form.custom_fields ?? []) as CustomField[];
  const answers: Record<string, string> = {};
  for (const field of customFields) {
    const raw = data.custom_answers[field.key];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (field.required && !value) {
      return NextResponse.json(
        { error: `Campo obrigatório: ${field.label}` },
        { status: 400 },
      );
    }
    if (!value) continue;
    if (
      (field.type === "select" || field.type === "radio") &&
      !(field.options ?? []).includes(value)
    ) {
      return NextResponse.json(
        { error: `Opção inválida em: ${field.label}` },
        { status: 400 },
      );
    }
    if (field.type === "number" && Number.isNaN(Number(value))) {
      return NextResponse.json(
        { error: `Valor numérico inválido em: ${field.label}` },
        { status: 400 },
      );
    }
    answers[field.key] = value;
  }

  // Campos padrão: grava apenas os ativados no builder
  const standard = (form.standard_fields ?? []) as StandardFieldKey[];
  const email = data.email || null;

  const leadValues = {
    event_id: form.event_id,
    lead_form_id: form.id,
    full_name: data.full_name,
    email,
    phone: data.phone || null,
    company: standard.includes("company") ? data.company || null : null,
    job_title: standard.includes("job_title") ? data.job_title || null : null,
    city: standard.includes("city_state") ? data.city || null : null,
    state: standard.includes("city_state") ? data.state || null : null,
    interest: standard.includes("interest") ? data.interest || null : null,
    message: standard.includes("message") ? data.message || null : null,
    custom_answers: answers,
    marketing_consent: data.marketing_consent,
    consent_text_version: form.consent_text_version,
    source: "form_publico" as const,
    user_agent: userAgent,
    submitted_ip: ip,
  };

  // Dedup: mesmo e-mail no mesmo formulário nas últimas 24h → atualiza
  if (email) {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await marketing
      .from("event_leads")
      .select("id")
      .eq("lead_form_id", form.id)
      .ilike("email", email)
      .gte("created_at", dayAgo)
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await marketing
        .from("event_leads")
        .update(leadValues)
        .eq("id", existing.id);
      if (updateError) {
        return NextResponse.json({ error: "Erro ao gravar" }, { status: 500 });
      }
      return NextResponse.json({ ok: true, deduplicated: true });
    }
  }

  const { data: lead, error: insertError } = await marketing
    .from("event_leads")
    .insert(leadValues)
    .select("id")
    .single();
  if (insertError) {
    return NextResponse.json({ error: "Erro ao gravar" }, { status: 500 });
  }

  await logAction({
    userId: null,
    action: "mkt.event_lead.created_public",
    resourceType: "marketing.event_lead",
    resourceId: lead.id as string,
    metadata: {
      event_id: form.event_id,
      lead_form_id: form.id,
      marketing_consent: data.marketing_consent,
    },
  });

  return NextResponse.json({ ok: true });
}
