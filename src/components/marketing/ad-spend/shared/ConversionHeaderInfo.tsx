"use client";

import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CONVERSION_DEFINITION_TOOLTIP } from "@/lib/constants/marketing-ads";

/**
 * Ícone de info ao lado do header da coluna "Conversões" explicando que a
 * definição de conversão difere entre canais (Seção 6.2). Usa o tooltip shadcn.
 */
export function ConversionHeaderInfo({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={CONVERSION_DEFINITION_TOOLTIP}
        className={cn(
          "ml-1 inline-flex cursor-help items-center align-text-bottom text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground",
          className,
        )}
      >
        <Info className="h-3.5 w-3.5" />
      </TooltipTrigger>
      <TooltipContent>{CONVERSION_DEFINITION_TOOLTIP}</TooltipContent>
    </Tooltip>
  );
}
