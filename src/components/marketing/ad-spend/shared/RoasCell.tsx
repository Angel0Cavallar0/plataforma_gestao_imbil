import { ROAS_UNAVAILABLE_TOOLTIP } from "@/lib/constants/marketing-ads";
import { roasLabel } from "@/lib/marketing/ad-spend";
import type { AdPlatformSlug } from "@/types/marketing-ads";
import { AD_PLATFORMS } from "@/lib/constants/marketing-ads";

/**
 * Exibe o ROAS quando a plataforma fornece valor de conversão (Meta/Google).
 * Para LinkedIn — ou quando não há valor no período — mostra "—" com tooltip.
 */
export function RoasCell({
  platformSlug,
  roas,
}: {
  platformSlug: AdPlatformSlug;
  roas: number | null;
}) {
  const supportsRoas = AD_PLATFORMS[platformSlug].hasConversionValue;

  if (!supportsRoas) {
    return (
      <span
        className="cursor-help text-muted-foreground"
        title={ROAS_UNAVAILABLE_TOOLTIP}
      >
        —
      </span>
    );
  }

  if (roas == null) {
    return (
      <span
        className="cursor-help text-muted-foreground"
        title="Sem valor de conversão registrado no período."
      >
        —
      </span>
    );
  }

  return <span className="font-medium tabular-nums">{roasLabel(roas)}</span>;
}
