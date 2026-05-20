import { createAdminClient } from "@/lib/supabase/admin";
import { marketingSchema } from "@/lib/supabase/marketing";
import type { MetaCredentialsJson } from "@/types/marketing";

export async function getMetaToken(credentialId: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await marketingSchema(admin)
    .from("integration_credentials")
    .select("credentials, is_active")
    .eq("id", credentialId)
    .single();

  if (error || !data?.is_active) {
    throw new Error("Credencial Meta inativa ou não encontrada");
  }

  const creds = data.credentials as MetaCredentialsJson;
  const ref = creds.system_user_token_ref;
  if (!ref) throw new Error("Token Meta não configurado");

  const secretName = ref.replace(/^vault:/, "");
  const { data: secret, error: vaultError } = await admin
    .schema("marketing")
    .rpc("read_vault_secret", { p_name: secretName });

  if (vaultError || !secret) {
    throw new Error("Não foi possível ler o token do Vault");
  }

  await touchCredentialUsed(credentialId);
  return secret as string;
}

async function touchCredentialUsed(credentialId: string) {
  const admin = createAdminClient();
  await marketingSchema(admin)
    .from("integration_credentials")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", credentialId);
}

export async function testMetaConnectionWithToken(token: string): Promise<boolean> {
  const res = await fetch(
    `https://graph.facebook.com/me?access_token=${encodeURIComponent(token)}`,
  );
  return res.ok;
}

export function vaultSecretNames(credentialId: string) {
  const base = `meta_${credentialId}`;
  return {
    appSecret: `${base}_app_secret`,
    systemUserToken: `${base}_system_user_token`,
  };
}
