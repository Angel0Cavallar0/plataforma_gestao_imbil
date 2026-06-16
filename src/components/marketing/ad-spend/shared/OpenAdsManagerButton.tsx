"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { getAdsManagerUrl } from "@/server/actions/marketing/ad-spend";
import type { AdManagerLevel, AdPlatformSlug } from "@/types/marketing-ads";

type Props = {
  platformSlug: AdPlatformSlug;
  level?: AdManagerLevel;
  ids?: { campaignId?: string; adId?: string };
  label?: string;
  variant?: "outline" | "ghost" | "secondary";
  size?: "default" | "sm";
  className?: string;
};

/**
 * Botão que resolve a URL do gerenciador externo via server action e abre em
 * nova aba. Quando a conta não está cadastrada, fica desabilitado com tooltip
 * e link para Configurações → Integrações (Seção 8.3).
 */
export function OpenAdsManagerButton({
  platformSlug,
  level = "account",
  ids,
  label = "Abrir no gerenciador",
  variant = "outline",
  size = "sm",
  className,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [notConfigured, setNotConfigured] = useState(false);

  function handleClick() {
    startTransition(async () => {
      const res = await getAdsManagerUrl(platformSlug, level, ids);
      if (res.ok) {
        window.open(res.url, "_blank", "noopener,noreferrer");
        setNotConfigured(false);
      } else {
        setNotConfigured(true);
      }
    });
  }

  if (notConfigured) {
    return (
      <Link
        href="/configuracoes/modulos/marketing/integracoes"
        className={cn(
          buttonVariants({ variant: "ghost", size }),
          "text-muted-foreground",
          className,
        )}
        title="Configurar conta de anúncios em Configurações → Integrações"
      >
        Configurar conta
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(buttonVariants({ variant, size }), className)}
      title={label}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ExternalLink className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
