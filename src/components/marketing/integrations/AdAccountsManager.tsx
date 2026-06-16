"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

type Field = {
  name: string;
  label: string;
  placeholder: string;
  required: boolean;
  hint?: string;
};

const FIELDS: Record<AdPlatformSlug, Field[]> = {
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

function AdAccountCard({ slug, account }: { slug: AdPlatformSlug; account?: AdAccount }) {
  const meta = AD_PLATFORMS[slug];
  const fields = FIELDS[slug];
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const configured = Boolean(account?.external_account_id);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const values: Record<string, string> = {};
    for (const f of fields) values[f.name] = String(fd.get(f.name) ?? "").trim();

    startTransition(async () => {
      const res = await saveAdAccountAction(slug, values);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Conta de anúncios salva.");
      setOpen(false);
      router.refresh();
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const res = await removeAdAccountAction(slug);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Conta removida.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: meta.color }}
          />
          {meta.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {configured ? (
          <dl className="space-y-1 text-xs">
            {fields.map((f) => {
              const value = account?.credentials?.[f.name];
              if (!value) return null;
              return (
                <div key={f.name} className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{f.label.split(" —")[0]}</dt>
                  <dd className="truncate font-medium tabular-nums">{value}</dd>
                </div>
              );
            })}
          </dl>
        ) : (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
            Não configurada — o botão “Abrir no gerenciador” fica indisponível.
          </p>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
          >
            {configured ? (
              <>
                <Pencil className="h-4 w-4" /> Editar conta
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Adicionar conta
              </>
            )}
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Conta de anúncios — {meta.name}</DialogTitle>
              <DialogDescription>
                Apenas os IDs usados para abrir o gerenciador externo (deep link). Nenhuma
                chamada é feita à API da plataforma.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((f) => (
                <div key={f.name} className="space-y-1.5">
                  <Label htmlFor={`${slug}-${f.name}`}>{f.label}</Label>
                  <Input
                    id={`${slug}-${f.name}`}
                    name={f.name}
                    required={f.required}
                    placeholder={f.placeholder}
                    defaultValue={account?.credentials?.[f.name] ?? ""}
                  />
                  {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
                </div>
              ))}
              <div className="flex items-center justify-between gap-2 pt-2">
                {configured ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleRemove}
                    disabled={pending}
                    className="text-destructive hover:text-destructive"
                  >
                    Remover
                  </Button>
                ) : (
                  <span />
                )}
                <Button type="submit" disabled={pending}>
                  Salvar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

/**
 * Cadastro das contas de anúncio (Meta Ads, Google Ads, LinkedIn Ads) usadas
 * apenas para os deep links de "Abrir no gerenciador". Não toca na credencial
 * social do Meta (Facebook/Instagram), que é gerenciada à parte.
 */
export function AdAccountsManager({
  accounts,
}: {
  accounts: Partial<Record<AdPlatformSlug, AdAccount>>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {AD_PLATFORM_SLUGS.map((slug) => (
        <AdAccountCard key={slug} slug={slug} account={accounts[slug]} />
      ))}
    </div>
  );
}
