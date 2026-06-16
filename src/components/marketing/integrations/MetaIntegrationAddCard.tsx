"use client";

import {
  IntegrationAccountCard,
  type IntegrationField,
} from "@/components/marketing/integrations/IntegrationAccountCard";
import { saveMetaCredentialsAction } from "@/server/actions/marketing/credentials";

const FIELDS: IntegrationField[] = [
  {
    name: "label",
    label: "Rótulo da conta",
    placeholder: "Imbil Principal",
    required: true,
  },
  { name: "app_id", label: "App ID", required: true },
  { name: "app_secret", label: "App Secret", required: true, type: "password" },
  { name: "facebook_page_id", label: "Facebook Page ID", required: true },
  { name: "instagram_user_id", label: "Instagram User ID", required: true },
  {
    name: "system_user_token",
    label: "System User Token",
    required: true,
    type: "textarea",
    hint: "Armazenado de forma segura no Vault.",
  },
];

/**
 * Card "Adicionar integração Meta" (Facebook + Instagram) no mesmo formato dos
 * cards de conta de anúncio. Cria a credencial via saveMetaCredentialsAction —
 * a credencial existente continua sendo gerenciada pelo card de status.
 */
export function MetaIntegrationAddCard({
  platformId,
  connected,
}: {
  platformId: string;
  connected: boolean;
}) {
  return (
    <IntegrationAccountCard
      title="Meta (Facebook + Instagram)"
      description="Publicação de conteúdo nas redes sociais."
      configured={false}
      fields={FIELDS}
      dialogTitle="Adicionar integração Meta"
      dialogDescription="Credenciais para publicar no Facebook e Instagram. O App Secret e o token são guardados no Vault — nenhuma chamada de mídia paga é feita aqui."
      addLabel={connected ? "Adicionar outra conta" : "Conectar conta"}
      emptyHint={
        connected
          ? "Já existe uma conta conectada (veja o status acima)."
          : "Nenhuma conta conectada ainda."
      }
      successMessage="Credencial Meta salva."
      onSave={async (values) => {
        const res = await saveMetaCredentialsAction({
          platform_id: platformId,
          label: values.label,
          app_id: values.app_id,
          app_secret: values.app_secret,
          facebook_page_id: values.facebook_page_id,
          instagram_user_id: values.instagram_user_id,
          system_user_token: values.system_user_token,
        });
        return res.error ? { error: String(res.error) } : { success: true };
      }}
    />
  );
}
