"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Pequeno ícone de interrogação (?) que, ao passar o mouse (ou via teclado),
 * abre um tooltip estilo shadcn com a descrição da métrica/card.
 */
export function MetricInfo({ text, className }: { text: string; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={text}
        className={cn(
          "ml-1 inline-flex h-3.5 w-3.5 shrink-0 cursor-help select-none items-center justify-center rounded-full border border-muted-foreground/40 align-middle text-[9px] font-semibold leading-none text-muted-foreground outline-none hover:border-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        ?
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}
