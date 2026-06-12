"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { marketingSchema } from "@/lib/supabase/marketing";
import { requireAuth } from "@/lib/auth/session";
import { requireMarketingPermission } from "@/lib/auth/marketing";
import { logAction } from "@/lib/auth/audit";
import { hasMinRole } from "@/lib/auth/permissions";
import { generateAndStoreFormQr, getQrSignedUrl } from "@/lib/marketing/form-qrcode";
import { QR_BUCKET } from "@/lib/constants/marketing-events";
import {
  createLeadFormSchema,
  extendExpirationSchema,
  updateLeadFormSchema,
  type CreateLeadFormInput,
  type UpdateLeadFormInput,
} from "@/lib/validations/marketing/events";
import type { LeadForm } from "@/types/marketing-events";

const FORMS_PATH = "/modulos/marketing/eventos/formularios";

function revalidateForms(eventId?: string) {
  revalidatePath(FORMS_PATH);
  if (eventId) revalidatePath(`/modulos/marketing/eventos/${eventId}`);
}

export async function createLeadFormAction(input: CreateLeadFormInput) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "create");
  const data = createLeadFormSchema.parse(input);

  if (data.is_active && !hasMinRole(session.profile, "supervisao")) {
    return { error: "Ativar formulários exige perfil supervisão ou superior." };
  }

  const supabase = await createClient();
  const { data: form, error } = await marketingSchema(supabase)
    .from("lead_forms")
    .insert({
      ...data,
      privacy_policy_url: data.privacy_policy_url || null,
      expires_at: data.expires_at.toISOString(),
      created_by: session.user.id,
    })
    .select()
    .single();
  if (error) {
    if (error.code === "23505")
      return { error: "Já existe um formulário com esse slug." };
    return { error: error.message };
  }

  // QR Code gerado automaticamente junto com o link público
  let qrCodePath: string | null = null;
  try {
    qrCodePath = await generateAndStoreFormQr(
      form.id as string,
      form.slug as string,
      form.public_token as string,
    );
    await marketingSchema(supabase)
      .from("lead_forms")
      .update({ qr_code_path: qrCodePath })
      .eq("id", form.id);
  } catch {
    // QR pode ser regenerado depois — não bloqueia a criação do formulário
  }

  await logAction({
    userId: session.user.id,
    action: "mkt.lead_form.created",
    resourceType: "marketing.lead_form",
    resourceId: form.id as string,
    metadata: { event_id: data.event_id, slug: data.slug, is_active: data.is_active },
  });
  revalidateForms(data.event_id);
  return { data: { ...(form as unknown as LeadForm), qr_code_path: qrCodePath } };
}

export async function updateLeadFormAction(input: UpdateLeadFormInput) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "update");
  const { id, ...data } = updateLeadFormSchema.parse(input);
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await marketingSchema(supabase)
    .from("lead_forms")
    .select("slug, public_token, is_active, event_id")
    .eq("id", id)
    .single();
  if (fetchError) return { error: fetchError.message };

  if (
    data.is_active !== existing.is_active &&
    !hasMinRole(session.profile, "supervisao")
  ) {
    return { error: "Ativar/desativar formulários exige perfil supervisão ou superior." };
  }

  // Slug só muda em rascunho (formulário nunca ativado e sem submissões impressas)
  const slugChanged = data.slug !== existing.slug;
  if (slugChanged && existing.is_active) {
    return { error: "O slug não pode ser alterado em formulários ativos." };
  }

  const { error } = await marketingSchema(supabase)
    .from("lead_forms")
    .update({
      ...data,
      privacy_policy_url: data.privacy_policy_url || null,
      expires_at: data.expires_at.toISOString(),
    })
    .eq("id", id);
  if (error) {
    if (error.code === "23505")
      return { error: "Já existe um formulário com esse slug." };
    return { error: error.message };
  }

  if (slugChanged) {
    try {
      await generateAndStoreFormQr(id, data.slug, existing.public_token as string);
    } catch {
      // regenerável depois
    }
  }

  await logAction({
    userId: session.user.id,
    action: "mkt.lead_form.updated",
    resourceType: "marketing.lead_form",
    resourceId: id,
  });
  revalidateForms(existing.event_id as string);
  return { data: { id } };
}

export async function toggleLeadFormAction(formId: string, active: boolean) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "update");
  if (!hasMinRole(session.profile, "supervisao")) {
    return { error: "Ativar/desativar formulários exige perfil supervisão ou superior." };
  }
  const supabase = await createClient();

  if (active) {
    const { data: form } = await marketingSchema(supabase)
      .from("lead_forms")
      .select("privacy_policy_text, privacy_policy_url")
      .eq("id", formId)
      .single();
    if (!form?.privacy_policy_text && !form?.privacy_policy_url) {
      return {
        error:
          "Para ativar o formulário, preencha a política de privacidade (texto ou URL).",
      };
    }
  }

  const { data: updated, error } = await marketingSchema(supabase)
    .from("lead_forms")
    .update({ is_active: active })
    .eq("id", formId)
    .select("event_id")
    .single();
  if (error) return { error: error.message };

  await logAction({
    userId: session.user.id,
    action: active ? "mkt.lead_form.activated" : "mkt.lead_form.deactivated",
    resourceType: "marketing.lead_form",
    resourceId: formId,
  });
  revalidateForms(updated.event_id as string);
  return { data: { id: formId, is_active: active } };
}

export async function rotateFormTokenAction(formId: string) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "update");
  if (!hasMinRole(session.profile, "supervisao")) {
    return { error: "Rotacionar o token exige perfil supervisão ou superior." };
  }
  const supabase = await createClient();

  const newToken = randomUUID();
  const { data: form, error } = await marketingSchema(supabase)
    .from("lead_forms")
    .update({ public_token: newToken })
    .eq("id", formId)
    .select("slug, event_id")
    .single();
  if (error) return { error: error.message };

  // QRs antigos impressos param de funcionar — comportamento esperado da rotação
  try {
    await generateAndStoreFormQr(formId, form.slug as string, newToken);
  } catch {
    // QR regenerável depois; o link novo já vale
  }

  await logAction({
    userId: session.user.id,
    action: "mkt.lead_form.token_rotated",
    resourceType: "marketing.lead_form",
    resourceId: formId,
  });
  revalidateForms(form.event_id as string);
  return { data: { id: formId } };
}

export async function extendFormExpirationAction(input: {
  id: string;
  expires_at: Date;
}) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "update");
  if (!hasMinRole(session.profile, "supervisao")) {
    return { error: "Estender a expiração exige perfil supervisão ou superior." };
  }
  const { id, expires_at } = extendExpirationSchema.parse(input);
  const supabase = await createClient();

  const { data: form, error } = await marketingSchema(supabase)
    .from("lead_forms")
    .update({ expires_at: expires_at.toISOString() })
    .eq("id", id)
    .select("event_id")
    .single();
  if (error) return { error: error.message };

  await logAction({
    userId: session.user.id,
    action: "mkt.lead_form.expiration_extended",
    resourceType: "marketing.lead_form",
    resourceId: id,
    metadata: { expires_at: expires_at.toISOString() },
  });
  revalidateForms(form.event_id as string);
  return { data: { id } };
}

export async function deleteLeadFormAction(formId: string) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "delete");
  if (!hasMinRole(session.profile, "gestor")) {
    return { error: "Excluir formulários exige perfil gestor ou superior." };
  }
  const supabase = await createClient();

  const { data: form, error } = await marketingSchema(supabase)
    .from("lead_forms")
    .delete()
    .eq("id", formId)
    .select("event_id, qr_code_path")
    .single();
  if (error) return { error: error.message };

  if (form.qr_code_path) {
    const admin = createAdminClient();
    await admin.storage.from(QR_BUCKET).remove([form.qr_code_path as string]);
  }

  await logAction({
    userId: session.user.id,
    action: "mkt.lead_form.deleted",
    resourceType: "marketing.lead_form",
    resourceId: formId,
  });
  revalidateForms(form.event_id as string);
  return { data: { id: formId } };
}

export async function getFormQrDownloadUrlAction(formId: string) {
  const session = await requireAuth();
  await requireMarketingPermission(session.user.id, "read");
  const supabase = await createClient();

  const { data: form, error } = await marketingSchema(supabase)
    .from("lead_forms")
    .select("qr_code_path, slug, public_token")
    .eq("id", formId)
    .single();
  if (error) return { error: error.message };

  let path = form.qr_code_path as string | null;
  if (!path) {
    // QR ausente (falha na criação) — regenera sob demanda
    try {
      path = await generateAndStoreFormQr(
        formId,
        form.slug as string,
        form.public_token as string,
      );
      await marketingSchema(supabase)
        .from("lead_forms")
        .update({ qr_code_path: path })
        .eq("id", formId);
    } catch {
      return { error: "Não foi possível gerar o QR Code." };
    }
  }

  const url = await getQrSignedUrl(path);
  if (!url) return { error: "Não foi possível gerar a URL de download." };
  return { data: { url } };
}
