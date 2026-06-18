"use client";

import { Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { brl, int } from "@/lib/marketing/ad-spend";
import { cn } from "@/lib/utils";

/**
 * Selo "Impulsionado" (âmbar) com popover detalhando as métricas pagas do post
 * (Seção 3.6). O foco da aba Redes Sociais é orgânico — os campos ad_* são só
 * o contexto do impulsionamento daquele post.
 */
export function BoostedBadge({
  spend,
  impressions,
  reach,
  className,
}: {
  spend?: number | null;
  impressions?: number | null;
  reach?: number | null;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 outline-none transition-colors hover:bg-amber-500/25 focus-visible:ring-2 focus-visible:ring-amber-500/40 dark:text-amber-400",
          className,
        )}
      >
        <Sparkles className="h-3 w-3" />
        Impulsionado
        {spend != null && spend > 0 ? ` · ${brl(spend)}` : ""}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3">
        <p className="mb-2 text-xs font-semibold text-foreground">
          Desempenho pago do post
        </p>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Investimento</dt>
            <dd className="font-medium tabular-nums">{brl(spend)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Impressões pagas</dt>
            <dd className="font-medium tabular-nums">{int(impressions)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Alcance pago</dt>
            <dd className="font-medium tabular-nums">{int(reach)}</dd>
          </div>
        </dl>
      </PopoverContent>
    </Popover>
  );
}
