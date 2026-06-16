"use client";

import {
  IntegrationAccountCard,
  type IntegrationField,
} from "@/components/marketing/integrations/IntegrationAccountCard";
import { AD_PLATFORMS, AD_PLATFORM_SLUGS } from "@/lib/constants/marketing-ads";
import {
  removeAdAccountAction,
  saveAdAccountAction,
} from "@/server/actions/marketing/ad-accounts";
import type { AdPlatformSlug } from "@/types/marketing-ads";

export type AdAccount = {
  external_account_id: string | null;
  credentials: Record<string, string> | null;
};

const FIELDS: Record<AdPlatformSlug, IntegrationField[]> = {
  meta_ads: [
    {
      name: "ad_account_id",
      label: "ID da conta de anúncios",
      placeholder: "1234567890",
      required: true,
      hint: "Somente números — sem o prefixo 'act_'. Encontrado na URL do Gerenciador de Anúncios (act=...).",
    },
  ],
  google_ads: [
    {
      name: "customer_id",
      label: "Customer ID",
      placeholder: "1234567890",
      required: true,
      hint: "ID da conta Google Ads (sem hífens).",
    },
    {
      name: "login_customer_id",
      label: "Login Customer ID (MCC) — opcional",
      placeholder: "1234567890",
      required: false,
      hint: "Apenas se a conta estiver sob uma MCC.",
    },
  ],
  linkedin_ads: [
    {
      name: "account_id",
      label: "Account ID",
      placeholder: "512345678",
      required: true,
      hint: "ID da conta no Campaign Manager.",
    },
    {
      name: "organization_urn",
      label: "Organization URN — opcional",
      placeholder: "urn:li:organization:123456",
      required: false,
    },
  ],
};

export function AdAccountCard({
  slug,
  account,
}: {
  slug: AdPlatformSlug;
  account?: AdAccount;
}) {
  const meta = AD_PLATFORMS[slug];
  const fields = FIELDS[slug];
  const configured = Boolean(account?.external_account_id);

  const summary = fields
    .filter((f) => account?.credentials?.[f.name])
    .map((f) => ({
      label: f.label.split(" —")[0],
      value: account!.credentials![f.name]!,
    }));

  return (
    <IntegrationAccountCard
      title={meta.name}
      color={meta.color}
      configured={configured}
      statusLabel="Configurada"
      summary={summary}
      emptyHint="Não configurada — o botão “Abrir no gerenciador” fica indisponível."
      fields={fields}
      defaultValues={account?.credentials}
      dialogTitle={`Conta de anúncios — ${meta.name}`}
      dialogDescription="Apenas os IDs usados para abrir o gerenciador externo (deep link). Nenhuma chamada é feita à API da plataforma."
      addLabel="Adicionar conta"
      editLabel="Editar conta"
      successMessage="Conta de anúncios salva."
      onSave={(values) => saveAdAccountAction(slug, values)}
      onRemove={() => removeAdAccountAction(slug)}
    />
  );
}

/**
 * Cards das contas de anúncio (Meta Ads, Google Ads, LinkedIn Ads) usadas
 * apenas para os deep links de "Abrir no gerenciador". Renderiza os cards
 * soltos — o grid é provido pela página.
 */
export function AdAccountsManager({
  accounts,
}: {
  accounts: Partial<Record<AdPlatformSlug, AdAccount>>;
}) {
  return (
    <>
      {AD_PLATFORM_SLUGS.map((slug) => (
        <AdAccountCard key={slug} slug={slug} account={accounts[slug]} />
      ))}
    </>
  );
}
