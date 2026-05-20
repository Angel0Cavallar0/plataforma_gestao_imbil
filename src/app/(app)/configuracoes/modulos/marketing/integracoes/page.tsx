import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { hasMinRole } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { MetaCredentialsForm } from "@/components/marketing/integrations/MetaCredentialsForm";
import { MetaIntegrationCard } from "@/components/marketing/integrations/MetaIntegrationCard";
import {
  getMetaCredentials,
  getActivePlatforms,
} from "@/server/queries/marketing/content";
import type { MetaCredentialsJson } from "@/types/marketing";

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

  return (
    <div className="space-y-6">
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
        {(credentials as Array<Record<string, unknown>>).map((cred) => (
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
    </div>
  );
}
