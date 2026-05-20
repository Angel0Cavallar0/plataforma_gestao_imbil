"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  rotateMetaTokenAction,
  testMetaConnectionAction,
} from "@/server/actions/marketing/credentials";
import type { MetaCredentialsJson } from "@/types/marketing";
import { toast } from "sonner";

type Cred = {
  id: string;
  label: string;
  is_active: boolean;
  last_validated_at: string | null;
  credentials: MetaCredentialsJson;
  external_account_id: string | null;
};

export function MetaIntegrationCard({ credential }: { credential: Cred }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const creds = credential.credentials;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{credential.label}</CardTitle>
        <Badge variant={credential.is_active ? "success" : "destructive"}>
          {credential.is_active ? "Conectado" : "Inativo"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">App ID:</span> {creds.app_id}
        </p>
        <p>
          <span className="text-muted-foreground">Page ID:</span> {creds.facebook_page_id}
        </p>
        <p>
          <span className="text-muted-foreground">IG ID:</span> {creds.instagram_user_id}
        </p>
        {credential.last_validated_at && (
          <p className="text-xs text-muted-foreground">
            Última validação:{" "}
            {new Date(credential.last_validated_at).toLocaleString("pt-BR")}
          </p>
        )}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await testMetaConnectionAction(credential.id);
                if (res.ok) toast.success("Conexão OK");
                else toast.error(res.error ?? "Falha na conexão");
                router.refresh();
              })
            }
          >
            Testar conexão
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => {
              const token = prompt("Cole o novo System User Token:");
              if (!token) return;
              startTransition(async () => {
                const res = await rotateMetaTokenAction({
                  credential_id: credential.id,
                  system_user_token: token,
                });
                if (res.error) toast.error(String(res.error));
                else {
                  toast.success(
                    res.ok ? "Token rotacionado" : "Token salvo, conexão falhou",
                  );
                  router.refresh();
                }
              });
            }}
          >
            Rotacionar token
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
