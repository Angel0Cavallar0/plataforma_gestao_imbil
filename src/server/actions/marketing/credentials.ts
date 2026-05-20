"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { marketingSchema } from "@/lib/supabase/marketing";
import { requireAuth } from "@/lib/auth/session";
import { hasMinRole } from "@/lib/auth/permissions";
import { logAction } from "@/lib/auth/audit";
import {
  rotateMetaTokenSchema,
  saveMetaCredentialsSchema,
  type RotateMetaTokenInput,
  type SaveMetaCredentialsInput,
} from "@/lib/validations/marketing/credentials";
import {
  testMetaConnectionWithToken,
  vaultSecretNames,
} from "@/lib/integrations/meta/credentials";

export async function saveMetaCredentialsAction(input: SaveMetaCredentialsInput) {
  const session = await requireAuth();
  if (!hasMinRole(session.profile, "gestor")) {
    return { error: "Apenas gestor+ pode gerenciar integrações" };
  }

  const data = saveMetaCredentialsSchema.parse(input);
  const admin = createAdminClient();

  const { data: cred, error } = await marketingSchema(admin)
    .from("integration_credentials")
    .insert({
      platform_id: data.platform_id,
      label: data.label,
      external_account_id: data.facebook_page_id,
      external_account_name: data.label,
      credentials: {
        app_id: data.app_id,
        facebook_page_id: data.facebook_page_id,
        instagram_user_id: data.instagram_user_id,
      },
      scopes: data.scopes ?? null,
      created_by: session.user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  const names = vaultSecretNames(cred.id);
  await admin.schema("marketing").rpc("store_vault_secret", {
    p_name: names.appSecret,
    p_secret: data.app_secret,
    p_description: `Meta App Secret ${cred.id}`,
  });
  await admin.schema("marketing").rpc("store_vault_secret", {
    p_name: names.systemUserToken,
    p_secret: data.system_user_token,
    p_description: `Meta System User Token ${cred.id}`,
  });

  await marketingSchema(admin)
    .from("integration_credentials")
    .update({
      credentials: {
        app_id: data.app_id,
        facebook_page_id: data.facebook_page_id,
        instagram_user_id: data.instagram_user_id,
        app_secret_ref: `vault:${names.appSecret}`,
        system_user_token_ref: `vault:${names.systemUserToken}`,
      },
    })
    .eq("id", cred.id);

  const valid = await testMetaConnectionWithToken(data.system_user_token);
  await marketingSchema(admin)
    .from("integration_credentials")
    .update({
      is_active: valid,
      last_validated_at: new Date().toISOString(),
    })
    .eq("id", cred.id);

  await logAction({
    userId: session.user.id,
    action: "mkt.integration.credential_saved",
    resourceType: "marketing.integration_credentials",
    resourceId: cred.id,
    metadata: { label: data.label, valid },
  });

  revalidatePath("/configuracoes/modulos/marketing/integracoes");
  return { data: cred, connectionOk: valid };
}

export async function testMetaConnectionAction(credentialId: string) {
  const session = await requireAuth();
  if (!hasMinRole(session.profile, "gestor")) {
    return { error: "Sem permissão" };
  }

  const { getMetaToken } = await import("@/lib/integrations/meta/credentials");
  try {
    const token = await getMetaToken(credentialId);
    const ok = await testMetaConnectionWithToken(token);
    const admin = createAdminClient();
    await marketingSchema(admin)
      .from("integration_credentials")
      .update({
        is_active: ok,
        last_validated_at: new Date().toISOString(),
      })
      .eq("id", credentialId);
    return { ok };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Falha" };
  }
}

export async function rotateMetaTokenAction(input: RotateMetaTokenInput) {
  const session = await requireAuth();
  if (!hasMinRole(session.profile, "gestor")) {
    return { error: "Sem permissão" };
  }
  const data = rotateMetaTokenSchema.parse(input);
  const admin = createAdminClient();
  const names = vaultSecretNames(data.credential_id);

  await admin.schema("marketing").rpc("store_vault_secret", {
    p_name: names.systemUserToken,
    p_secret: data.system_user_token,
    p_description: `Meta token rotacionado ${data.credential_id}`,
  });

  const ok = await testMetaConnectionWithToken(data.system_user_token);
  await marketingSchema(admin)
    .from("integration_credentials")
    .update({
      is_active: ok,
      last_validated_at: new Date().toISOString(),
    })
    .eq("id", data.credential_id);

  revalidatePath("/configuracoes/modulos/marketing/integracoes");
  return { ok };
}
