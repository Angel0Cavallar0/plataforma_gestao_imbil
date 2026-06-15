import { Info } from "lucide-react";
import { CONVERSION_DEFINITION_TOOLTIP } from "@/lib/constants/marketing-ads";

/**
 * Ícone de info ao lado do header da coluna "Conversões" explicando que a
 * definição de conversão difere entre canais (Seção 6.2).
 */
export function ConversionHeaderInfo({ className }: { className?: string }) {
  return (
    <span
      className={className}
      title={CONVERSION_DEFINITION_TOOLTIP}
      aria-label={CONVERSION_DEFINITION_TOOLTIP}
    >
      <Info className="inline h-3.5 w-3.5 cursor-help align-text-bottom text-muted-foreground" />
    </span>
  );
}
