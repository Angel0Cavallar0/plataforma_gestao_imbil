import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { hasMinRole } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { MetaCredentialsForm } from "@/components/marketing/integrations/MetaCredentialsForm";
import { MetaIntegrationCard } from "@/components/marketing/integrations/MetaIntegrationCard";
import {
  AdAccountsManager,
  type AdAccount,
} from "@/components/marketing/integrations/AdAccountsManager";
import {
  getMetaCredentials,
  getActivePlatforms,
} from "@/server/queries/marketing/content";
import { AD_PLATFORM_SLUGS } from "@/lib/constants/marketing-ads";
import type { MetaCredentialsJson } from "@/types/marketing";
import type { AdPlatformSlug } from "@/types/marketing-ads";

const AD_SLUGS = new Set<string>(AD_PLATFORM_SLUGS);

export default async function MarketingIntegracoesPage() {
  const session = await requireAuth();
  if (!hasMinRole(session.profile, "gestor")) {
    redirect("/configuracoes/modulos");
  }

  const [credentials, platforms] = await Promise.all([
    getMetaCredentials(),
    getActivePlatforms(),
  ]);

  const instagramPlatform = platforms.find((p) => p.slug === "instagram");

  const allCreds = credentials as Array<Record<string, unknown>>;
  const platformSlug = (c: Record<string, unknown>): string | undefined => {
    const p = c.platform as { slug?: string } | { slug?: string }[] | null;
    return Array.isArray(p) ? p[0]?.slug : p?.slug;
  };

  // Credenciais sociais (Meta Facebook/Instagram) — exclui contas de ads.
  const socialCreds = allCreds.filter((c) => !AD_SLUGS.has(platformSlug(c) ?? ""));

  // Contas de anúncio (deep links) por plataforma de ads.
  const adAccounts: Partial<Record<AdPlatformSlug, AdAccount>> = {};
  for (const c of allCreds) {
    const slug = platformSlug(c);
    if (slug && AD_SLUGS.has(slug)) {
      adAccounts[slug as AdPlatformSlug] = {
        external_account_id: (c.external_account_id as string | null) ?? null,
        credentials: (c.credentials as Record<string, string> | null) ?? null,
      };
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/configuracoes/modulos"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Parâmetros dos módulos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Integrações de Marketing</h1>
        <p className="text-sm text-muted-foreground">
          Credenciais Meta (Facebook + Instagram). Tokens armazenados no Vault.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {socialCreds.map((cred) => (
          <MetaIntegrationCard
            key={cred.id as string}
            credential={{
              id: cred.id as string,
              label: cred.label as string,
              is_active: cred.is_active as boolean,
              last_validated_at: cred.last_validated_at as string | null,
              credentials: cred.credentials as MetaCredentialsJson,
              external_account_id: cred.external_account_id as string | null,
            }}
          />
        ))}
      </div>

      {instagramPlatform && (
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-medium">Adicionar integração Meta</h2>
          <MetaCredentialsForm platformId={instagramPlatform.id} />
        </div>
      )}

      <div className="space-y-3 border-t pt-8">
        <div>
          <h2 className="text-lg font-medium">Contas de anúncio (Mídia Paga)</h2>
          <p className="text-sm text-muted-foreground">
            Cadastre os IDs das contas de anúncio usados pelo botão “Abrir no gerenciador”
            do submódulo de Mídia Paga. Apenas direciona para as páginas das plataformas —
            não faz chamadas às APIs.
          </p>
        </div>
        <AdAccountsManager accounts={adAccounts} />
      </div>
    </div>
  );
}
