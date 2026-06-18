import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { hasMinRole } from "@/lib/auth/permissions";
import { getReportsWebhookUrl } from "@/server/queries/marketing/reports-control";
import { ReportsWebhookConfig } from "@/components/marketing/insights/settings/ReportsWebhookConfig";

export default async function MarketingRelatoriosConfigPage() {
  const session = await requireAuth();
  if (!hasMinRole(session.profile, "gestor")) {
    redirect("/configuracoes/modulos");
  }

  const url = await getReportsWebhookUrl();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/configuracoes/modulos"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Parâmetros dos módulos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Relatórios de Marketing</h1>
        <p className="text-sm text-muted-foreground">
          Configure o webhook do n8n usado pelo botão “Gerar Relatório” dos Insights. A
          URL é sensível e fica restrita a gestores.
        </p>
      </div>

      <div className="max-w-2xl">
        <ReportsWebhookConfig initialUrl={url} />
      </div>
    </div>
  );
}
