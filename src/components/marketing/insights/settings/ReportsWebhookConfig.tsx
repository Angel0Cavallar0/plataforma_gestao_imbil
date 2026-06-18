"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DAILY_REPORT_LIMIT } from "@/lib/constants/marketing-insights";
import {
  saveReportsWebhookUrl,
  testReportsWebhook,
} from "@/server/actions/marketing/reports";

/** Configuração do webhook de relatórios (Seção 9.2). gestor+ */
export function ReportsWebhookConfig({ initialUrl }: { initialUrl: string }) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [savePending, startSave] = useTransition();
  const [testPending, startTest] = useTransition();

  const savedConfigured = initialUrl.trim().length > 0;
  const dirty = url.trim() !== initialUrl.trim();

  function save() {
    startSave(async () => {
      const res = await saveReportsWebhookUrl(url.trim());
      if (res.ok) {
        toast.success("Webhook salvo.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Não foi possível salvar.");
      }
    });
  }

  function test() {
    startTest(async () => {
      const res = await testReportsWebhook();
      if (res.ok) toast.success(`Webhook respondeu ${res.status ?? 200}.`);
      else toast.error(res.error ?? "Falha ao testar o webhook.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Webhook de geração de relatórios (n8n)
          <Badge variant={savedConfigured ? "success" : "muted"}>
            {savedConfigured ? "Configurado" : "Não configurado"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="webhook-url" className="text-sm font-medium">
            URL do webhook
          </label>
          <Input
            id="webhook-url"
            type="url"
            inputMode="url"
            placeholder="https://n8n.imbil.com.br/webhook/imbil-marketing-report"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Endpoint que dispara a geração de relatórios. Deve usar https.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={save} disabled={savePending || !dirty}>
            {savePending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Salvar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={test}
            disabled={testPending || !savedConfigured}
            title={
              savedConfigured
                ? "Envia um ping de teste ao webhook salvo"
                : "Salve a URL antes de testar"
            }
          >
            {testPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Testar Webhook
          </Button>
          {dirty && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              Alterações não salvas — o teste usa a URL já salva.
            </span>
          )}
        </div>

        <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
          Limite diário de solicitações: <strong>{DAILY_REPORT_LIMIT}</strong> (global,
          fixo). O disparo e o limite são validados no servidor.
        </div>
      </CardContent>
    </Card>
  );
}
