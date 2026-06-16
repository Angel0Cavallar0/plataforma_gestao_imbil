"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { hasMinRole } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { marketingSchema } from "@/lib/supabase/marketing";
import { logAction } from "@/lib/auth/audit";
import {
  adAccountPlatformEnum,
  googleAdAccountSchema,
  linkedinAdAccountSchema,
  metaAdAccountSchema,
} from "@/lib/validations/marketing/ad-accounts";
import type { AdPlatformSlug } from "@/types/marketing-ads";

const PLATFORM_LABEL: Record<AdPlatformSlug, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  linkedin_ads: "LinkedIn Ads",
};

const INTEGRACOES_PATH = "/configuracoes/modulos/marketing/integracoes";

type ActionResult = { success: true } | { error: string };

/**
 * Cadastra/atualiza a conta de anúncios de uma plataforma (apenas os IDs
 * usados nos deep links). Não chama nenhuma API externa — só grava em
 * marketing.integration_credentials. Uma credencial por plataforma de ads.
 */
export async function saveAdAccountAction(
  platformSlug: AdPlatformSlug,
  input: Record<string, string>,
): Promise<ActionResult> {
  const session = await requireAuth();
  if (!hasMinRole(session.profile, "gestor")) {
    return { error: "Apenas gestor+ pode cadastrar contas de anúncio." };
  }

  const slug = adAccountPlatformEnum.parse(platformSlug);

  let credentials: Record<string, string>;
  let external: string;

  if (slug === "meta_ads") {
    const d = metaAdAccountSchema.parse(input);
    const id = d.ad_account_id.replace(/^act_/, "");
    credentials = { ad_account_id: id };
    external = id;
  } else if (slug === "google_ads") {
    const d = googleAdAccountSchema.parse(input);
    const id = d.customer_id.replace(/\D/g, "");
    credentials = { customer_id: id };
    if (d.login_customer_id) {
      credentials.login_customer_id = d.login_customer_id.replace(/\D/g, "");
    }
    external = id;
  } else {
    const d = linkedinAdAccountSchema.parse(input);
    credentials = { account_id: d.account_id };
    if (d.organization_urn) credentials.organization_urn = d.organization_urn;
    external = d.account_id;
  }

  const admin = createAdminClient();

  const { data: platform, error: pErr } = await marketingSchema(admin)
    .from("platforms")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (pErr || !platform) return { error: "Plataforma não encontrada." };
  const platformId = (platform as { id: string }).id;

  const { data: existing } = await marketingSchema(admin)
    .from("integration_credentials")
    .select("id")
    .eq("platform_id", platformId)
    .maybeSingle();

  if (existing) {
    const { error } = await marketingSchema(admin)
      .from("integration_credentials")
      .update({
        external_account_id: external,
        external_account_name: PLATFORM_LABEL[slug],
        credentials,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", (existing as { id: string }).id);
    if (error) return { error: "Não foi possível salvar a conta." };
  } else {
    const { error } = await marketingSchema(admin)
      .from("integration_credentials")
      .insert({
        platform_id: platformId,
        label: PLATFORM_LABEL[slug],
        external_account_id: external,
        external_account_name: PLATFORM_LABEL[slug],
        credentials,
        is_active: true,
        created_by: session.profile.id,
      });
    if (error) return { error: "Não foi possível salvar a conta." };
  }

  await logAction({
    userId: session.profile.id,
    action: "mkt.ad_account.saved",
    resourceType: "integration_credentials",
    metadata: { platform: slug },
  });

  revalidatePath(INTEGRACOES_PATH);
  return { success: true };
}

/** Remove (desativa) a conta de anúncios cadastrada de uma plataforma. */
export async function removeAdAccountAction(
  platformSlug: AdPlatformSlug,
): Promise<ActionResult> {
  const session = await requireAuth();
  if (!hasMinRole(session.profile, "gestor")) {
    return { error: "Apenas gestor+ pode remover contas de anúncio." };
  }
  const slug = adAccountPlatformEnum.parse(platformSlug);

  const admin = createAdminClient();
  const { data: platform } = await marketingSchema(admin)
    .from("platforms")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!platform) return { error: "Plataforma não encontrada." };

  const { error } = await marketingSchema(admin)
    .from("integration_credentials")
    .delete()
    .eq("platform_id", (platform as { id: string }).id);
  if (error) return { error: "Não foi possível remover a conta." };

  await logAction({
    userId: session.profile.id,
    action: "mkt.ad_account.removed",
    resourceType: "integration_credentials",
    metadata: { platform: slug },
  });

  revalidatePath(INTEGRACOES_PATH);
  return { success: true };
}
